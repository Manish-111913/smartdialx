"""Read-side queries: the snapshot pacing/safety use, and run metrics for reports."""

import json
from collections import Counter

from .clock import Clock
from .config import Settings
from .db import Database
from .models import CampaignStatus, Mode, Snapshot


def take_snapshot(db: Database, clock: Clock, settings: Settings, campaign_id: int) -> Snapshot:
    now = clock.now()
    s = settings.safety
    p = settings.pacing
    with db.read() as conn:
        camp = conn.execute(
            "SELECT status, mode, provider, screening FROM campaigns WHERE id = ?", (campaign_id,)
        ).fetchone()
        snap = Snapshot(
            campaign_id=campaign_id,
            campaign_status=CampaignStatus(camp["status"]),
            mode=Mode(camp["mode"]),
            now=now,
        )

        agents = dict(conn.execute("SELECT state, COUNT(*) FROM agents GROUP BY state").fetchall())
        snap.available_agents = agents.get("AVAILABLE", 0)
        snap.connected_agents = agents.get("CONNECTED", 0)
        snap.staffed_agents = sum(v for k, v in agents.items() if k != "OFFLINE")

        # wrap-ups ending before a call dialed now is likely to be answered
        setup = _avg_setup(conn, campaign_id) or 0.0
        snap.avg_setup_s = setup or None
        snap.wrap_up_ending_soon = conn.execute(
            "SELECT COUNT(*) FROM agents WHERE state = 'WRAP_UP' AND wrap_up_until <= ?", (now + setup,)
        ).fetchone()[0]

        live = conn.execute(
            "SELECT bound, state, COUNT(*) AS n FROM calls"
            " WHERE campaign_id = ? AND state IN ('RESERVED', 'INITIATED', 'RINGING', 'ANSWERED', 'CONNECTED')"
            " GROUP BY bound, state",
            (campaign_id,),
        ).fetchall()
        for row in live:
            snap.active_calls += row["n"]
            if row["state"] in ("RESERVED", "INITIATED", "RINGING"):
                if row["bound"]:
                    snap.bound_in_flight += row["n"]
                else:
                    snap.unbound_in_flight += row["n"]

        snap.queued_ready = conn.execute(
            "SELECT COUNT(*) FROM calls WHERE campaign_id = ? AND state = 'QUEUED' AND not_before <= ?",
            (campaign_id, now),
        ).fetchone()[0]
        snap.calls_started = conn.execute(
            "SELECT COUNT(*) FROM calls WHERE campaign_id = ? AND sending_at IS NOT NULL", (campaign_id,)
        ).fetchone()[0]

        ring = [r[0] for r in conn.execute(
            "SELECT ring_result FROM calls WHERE campaign_id = ? AND ring_result IS NOT NULL"
            " ORDER BY ring_result_at DESC, id DESC LIMIT ?",
            (campaign_id, p.answer_window),
        )]
        snap.ring_total = len(ring)
        snap.ring_answered = ring.count("answered")
        short = ring[: s.answer_rate_short_window]
        snap.short_total = len(short)
        snap.short_answered = short.count("answered")

        answered = [r[0] for r in conn.execute(
            "SELECT state FROM calls WHERE campaign_id = ? AND answered_at IS NOT NULL"
            "   AND state IN ('CONNECTED', 'COMPLETED', 'FAILED', 'ABANDONED')"
            " ORDER BY answered_at DESC, id DESC LIMIT ?",
            (campaign_id, s.abandon_window),
        )]
        snap.recent_answered = len(answered)
        snap.recent_abandoned = answered.count("ABANDONED")

        talk = conn.execute(
            "SELECT AVG(talk_seconds) FROM (SELECT talk_seconds FROM calls WHERE campaign_id = ?"
            " AND state = 'COMPLETED' AND talk_seconds IS NOT NULL ORDER BY ended_at DESC LIMIT 100)",
            (campaign_id,),
        ).fetchone()[0]
        snap.avg_talk_s = talk

        req = conn.execute(
            "SELECT COUNT(*) AS n, SUM(result IN ('rejected', 'timeout')) AS bad FROM provider_requests"
            " WHERE provider = ? AND sent_at >= ? AND result IS NOT NULL",
            (camp["provider"], now - s.provider_window_s),
        ).fetchone()
        snap.provider_requests = req["n"] or 0
        snap.provider_errors = req["bad"] or 0

        if camp["screening"]:
            _screening_snapshot(conn, snap, campaign_id, p.answer_window, s.abandon_window)
    return snap


def _screening_snapshot(conn, snap: Snapshot, campaign_id: int, window: int, fail_window: int) -> None:
    snap.screening = True
    snap.screening_in_flight = conn.execute(
        "SELECT COUNT(*) FROM calls WHERE campaign_id = ? AND screening = 1"
        " AND state IN ('RESERVED', 'INITIATED', 'RINGING', 'ANSWERED', 'SCREENING')",
        (campaign_id,),
    ).fetchone()[0]
    snap.pending_transfers = conn.execute(
        "SELECT COUNT(*) FROM calls WHERE campaign_id = ? AND state = 'TRANSFER_PENDING' AND agent_id IS NULL",
        (campaign_id,),
    ).fetchone()[0]
    # only outcomes we actually know: answered calls still talking to the bot would
    # count as "not willing" and make us dial too hard
    rows = conn.execute(
        "SELECT ring_result, screen_result FROM calls WHERE campaign_id = ? AND ring_result IS NOT NULL"
        "   AND (ring_result = 'no_answer' OR screen_result IS NOT NULL"
        "        OR state IN ('COMPLETED', 'FAILED', 'CANCELLED', 'ABANDONED'))"
        " ORDER BY ring_result_at DESC, id DESC LIMIT ?",
        (campaign_id, window),
    ).fetchall()
    snap.ring_total = len(rows)
    snap.ring_answered = sum(1 for r in rows if r["ring_result"] == "answered")
    snap.screen_willing = sum(1 for r in rows if r["screen_result"] == "willing")
    willing = [r[0] for r in conn.execute(
        "SELECT end_reason FROM calls WHERE campaign_id = ? AND screen_result = 'willing'"
        "   AND state IN ('CONNECTED', 'COMPLETED', 'FAILED')"
        " ORDER BY screen_result_at DESC, id DESC LIMIT ?",
        (campaign_id, fail_window),
    )]
    snap.recent_willing = len(willing)
    snap.recent_transfer_failures = sum(1 for r in willing if r in ("no_agent_transfer", "caller_left_hold"))


def _avg_setup(conn, campaign_id: int) -> float | None:
    return conn.execute(
        "SELECT AVG(answered_at - sending_at) FROM (SELECT answered_at, sending_at FROM calls"
        " WHERE campaign_id = ? AND answered_at IS NOT NULL AND sending_at IS NOT NULL"
        " ORDER BY answered_at DESC LIMIT 100)",
        (campaign_id,),
    ).fetchone()[0]


def check_invariants(db: Database) -> list[str]:
    """Things that must never be true. Returns a description of each violation."""
    problems = []
    with db.read() as conn:
        for row in conn.execute(
            "SELECT agent_id, COUNT(*) n FROM calls WHERE agent_id IS NOT NULL"
            " AND state IN ('RESERVED', 'INITIATED', 'RINGING', 'ANSWERED', 'SCREENING', 'TRANSFER_PENDING', 'CONNECTED')"
            " GROUP BY agent_id HAVING n > 1"
        ):
            problems.append(f"agent {row['agent_id']} has {row['n']} live calls")
        for row in conn.execute(
            "SELECT borrower_id, COUNT(*) n FROM calls"
            " WHERE state IN ('QUEUED', 'RESERVED', 'INITIATED', 'RINGING', 'ANSWERED', 'SCREENING',"
            "                 'TRANSFER_PENDING', 'CONNECTED')"
            " GROUP BY borrower_id HAVING n > 1"
        ):
            problems.append(f"borrower {row['borrower_id']} has {row['n']} live calls")
        for row in conn.execute(
            "SELECT a.id, a.state, c.state AS cs FROM agents a LEFT JOIN calls c ON c.id = a.current_call_id"
            " WHERE a.state IN ('RESERVED', 'DIALING', 'CONNECTED')"
            "   AND (c.id IS NULL OR c.state IN ('COMPLETED', 'FAILED', 'CANCELLED', 'ABANDONED'))"
        ):
            problems.append(f"agent {row['id']} is {row['state']} but its call is {row['cs']}")
        for row in conn.execute(
            "SELECT c.id, c.state FROM calls c JOIN agents a ON a.id = c.agent_id"
            " WHERE c.state = 'CONNECTED' AND (a.state != 'CONNECTED' OR a.current_call_id IS NOT c.id)"
        ):
            problems.append(f"call {row['id']} is CONNECTED but its agent isn't on it")
        for row in conn.execute(
            "SELECT id FROM calls WHERE connected_at IS NOT NULL AND screen_result IS NOT NULL"
            " AND screen_result != 'willing'"
        ):
            problems.append(f"call {row['id']} reached an agent without a willing screen result")
        for row in conn.execute(
            "SELECT c.id FROM calls c JOIN agents a ON a.id = c.agent_id"
            " WHERE c.state = 'TRANSFER_PENDING' AND (a.state != 'RESERVED' OR a.current_call_id IS NOT c.id)"
        ):
            problems.append(f"call {row['id']} holds an agent for transfer that isn't reserved for it")
    return problems


def campaign_metrics(db: Database, campaign_id: int) -> dict:
    with db.read() as conn:
        states = Counter(dict(conn.execute(
            "SELECT state, COUNT(*) FROM calls WHERE campaign_id = ? GROUP BY state", (campaign_id,)
        ).fetchall()))
        reasons = dict(conn.execute(
            "SELECT end_reason, COUNT(*) FROM calls WHERE campaign_id = ? AND end_reason IS NOT NULL"
            " GROUP BY end_reason ORDER BY 2 DESC",
            (campaign_id,),
        ).fetchall())
        initiated = conn.execute(
            "SELECT COUNT(*) FROM calls WHERE campaign_id = ? AND sending_at IS NOT NULL", (campaign_id,)
        ).fetchone()[0]
        answered = conn.execute(
            "SELECT COUNT(*) FROM calls WHERE campaign_id = ? AND answered_at IS NOT NULL", (campaign_id,)
        ).fetchone()[0]
        connected = conn.execute(
            "SELECT COUNT(*) FROM calls WHERE campaign_id = ? AND connected_at IS NOT NULL", (campaign_id,)
        ).fetchone()[0]
        ring_total = conn.execute(
            "SELECT COUNT(*) FROM calls WHERE campaign_id = ? AND ring_result IS NOT NULL", (campaign_id,)
        ).fetchone()[0]
        mine = "SELECT id FROM calls WHERE campaign_id = ?"
        requests = dict(conn.execute(
            f"SELECT COALESCE(result, 'pending'), COUNT(*) FROM provider_requests WHERE call_id IN ({mine}) GROUP BY 1",
            (campaign_id,),
        ).fetchall())
        events = dict(conn.execute(
            f"SELECT COALESCE(outcome, 'pending'), COUNT(*) FROM provider_events WHERE call_id IN ({mine})"
            "   OR (call_id IS NULL AND outcome IS NULL) GROUP BY 1",
            (campaign_id,),
        ).fetchall())
        duplicates = conn.execute(
            "SELECT COALESCE(SUM(deliveries - 1), 0) FROM provider_events"
            f" WHERE call_id IN ({mine}) OR call_id IS NULL",
            (campaign_id,),
        ).fetchone()[0]
        talk = conn.execute(
            "SELECT COALESCE(SUM(talk_seconds), 0) AS agent,"
            "       COALESCE(SUM(CASE WHEN end_reason = 'not_interested' THEN 0 ELSE talk_seconds END), 0) AS productive"
            " FROM calls WHERE campaign_id = ? AND connected_at IS NOT NULL AND state = 'COMPLETED'",
            (campaign_id,),
        ).fetchone()
        productive = conn.execute(
            "SELECT COUNT(*) FROM calls WHERE campaign_id = ? AND connected_at IS NOT NULL"
            "   AND COALESCE(end_reason, '') != 'not_interested'",
            (campaign_id,),
        ).fetchone()[0]
        screening = _screening_metrics(conn, campaign_id)
        decisions = dict(conn.execute(
            "SELECT action, COUNT(*) FROM decisions WHERE campaign_id = ? GROUP BY action", (campaign_id,)
        ).fetchall())
        reason_counts: Counter = Counter()
        for (raw,) in conn.execute(
            "SELECT safety_reasons FROM decisions WHERE campaign_id = ? AND safety_reasons IS NOT NULL", (campaign_id,)
        ):
            for r in json.loads(raw):
                reason_counts[r.split(":")[0]] += 1
        recovery = dict(conn.execute(
            f"SELECT action, COUNT(*) FROM recovery_log WHERE call_id IN ({mine}) OR call_id IS NULL GROUP BY action",
            (campaign_id,),
        ).fetchall())
        borrowers = dict(conn.execute(
            "SELECT COALESCE(outcome, 'open'), COUNT(*) FROM borrowers WHERE campaign_id = ? GROUP BY 1", (campaign_id,)
        ).fetchall())

    return {
        "calls_initiated": initiated,
        "calls_answered": answered,
        "calls_connected": connected,
        "calls_completed": states["COMPLETED"],
        "calls_failed": states["FAILED"],
        "calls_cancelled": states["CANCELLED"],
        "calls_abandoned": states["ABANDONED"],
        "calls_queued": states["QUEUED"],
        "calls_live": sum(states[s] for s in ("RESERVED", "INITIATED", "RINGING", "ANSWERED", "SCREENING",
                                              "TRANSFER_PENDING", "CONNECTED")),
        # conversations with a human agent; "productive" excludes short "not now" calls
        "agent_conversations": connected,
        "productive_conversations": productive,
        "agent_talk_s": round(talk["agent"], 1),
        "productive_talk_s": round(talk["productive"], 1),
        "answer_rate": round(answered / ring_total, 3) if ring_total else None,
        "abandon_rate": round(states["ABANDONED"] / answered, 4) if answered else 0.0,
        "end_reasons": reasons,
        "provider_requests": requests,
        "events": events,
        "duplicate_deliveries": duplicates,
        "decisions": decisions,
        "safety_reasons": dict(reason_counts),
        "recovery": recovery,
        "borrowers": borrowers,
        "screening": screening,
    }


def _screening_metrics(conn, campaign_id: int) -> dict | None:
    row = conn.execute(
        "SELECT"
        "  COUNT(*) AS attempted,"
        "  SUM(answered_at IS NOT NULL) AS answered,"
        "  SUM(screen_result = 'willing') AS willing,"
        "  SUM(screen_result = 'unavailable') AS unavailable,"
        "  SUM(screen_result = 'declined') AS declined,"
        "  SUM(screen_result = 'failed' OR end_reason = 'screen_failed') AS screen_failed,"
        "  SUM(end_reason = 'no_answer') AS no_answer,"
        "  SUM(end_reason = 'busy') AS busy,"
        "  SUM(end_reason IN ('provider_rejected', 'not_placed', 'timed_out', 'network', 'failed', 'lost',"
        "                     'unreconciled')) AS provider_failures,"
        "  SUM(transfer_attempts) AS transfer_attempts,"
        "  SUM(connected_at IS NOT NULL) AS agent_connections,"
        "  SUM(end_reason = 'no_agent_transfer') AS no_agent,"
        "  SUM(end_reason = 'caller_left_hold') AS caller_left_hold,"
        "  SUM(end_reason = 'transfer_blocked') AS transfer_blocked,"
        "  AVG(CASE WHEN connected_at IS NOT NULL THEN connected_at - transfer_requested_at END) AS avg_hold_s"
        " FROM calls WHERE campaign_id = ? AND screening = 1 AND sending_at IS NOT NULL",
        (campaign_id,),
    ).fetchone()
    if not row["attempted"]:
        return None
    out = {k: (row[k] or 0) for k in row.keys()}
    out["avg_hold_s"] = round(row["avg_hold_s"], 1) if row["avg_hold_s"] is not None else None
    return out
