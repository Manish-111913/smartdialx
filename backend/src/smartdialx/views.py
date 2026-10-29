"""Read-side queries for the web console.

Each function returns plain dicts and lists ready for JSON. Nothing in here writes.
Time windows are "calls started in the last `since` seconds" (a cohort), so funnel
numbers always add up: every willing borrower in the window also counts as an
attempt and an answer in the same window.

Ids shown on screen are derived from database ids: AG-1001 is agent 1, CALL-10042
is call 42, CMP-101 is campaign 1.
"""

import dataclasses
import json
import math

from .models import LIVE_CALL_STATES, Mode
from .pacing import PredictivePacer
from .safety import SafetyController
from .stats import campaign_metrics, take_snapshot

LIVE = tuple(s.value for s in LIVE_CALL_STATES)
TERMINAL = ("COMPLETED", "FAILED", "CANCELLED", "ABANDONED")
_IN_LIVE = "(" + ", ".join(f"'{s}'" for s in LIVE) + ")"
_IN_TERMINAL = "(" + ", ".join(f"'{s}'" for s in TERMINAL) + ")"

# screening outcome of a call, worked out from its columns (see outcome labels in the UI)
OUTCOME_SQL = f"""
    CASE
      WHEN c.screening = 0 THEN NULL
      WHEN c.screen_result = 'willing' THEN 'willing'
      WHEN c.screen_result = 'unavailable' THEN 'callback_later'
      WHEN c.screen_result = 'declined' THEN 'declined'
      WHEN c.screen_result = 'failed' OR c.end_reason = 'screen_failed' THEN 'screening_failed'
      WHEN c.end_reason = 'no_answer' THEN 'no_answer'
      WHEN c.end_reason = 'busy' THEN 'busy'
      WHEN c.state = 'QUEUED' THEN 'not_started'
      WHEN c.state IN {_IN_LIVE} THEN 'in_progress'
      ELSE 'not_reached'
    END"""


# a stale event that only repeats the state the call is already in, e.g. the provider's
# INITIATED arriving after we recorded the request as accepted. Harmless, not out of order
def _redundant(alias: str = "") -> str:
    a = f"{alias}." if alias else ""
    return f"({a}outcome = 'stale' AND {a}note = {a}event_type || ' while ' || {a}event_type)"


def agent_code(agent_id):
    return f"AG-{1000 + agent_id}" if agent_id is not None else None


def call_code(call_id):
    return f"CALL-{10000 + call_id}" if call_id is not None else None


def campaign_code(campaign_id):
    return f"CMP-{100 + campaign_id}" if campaign_id is not None else None


def _mask(phone: str | None) -> str | None:
    return f"***-{phone[-4:]}" if phone else None


def _camp(column: str, campaign_id: int | None) -> tuple[str, list]:
    return (f" AND {column} = ?", [campaign_id]) if campaign_id else ("", [])


def _round(v, n=1):
    return round(v, n) if v is not None else None


# ---- system -------------------------------------------------------------------


def health(c) -> dict:
    with c.db.read() as conn:
        running = conn.execute("SELECT COUNT(*) FROM campaigns WHERE status = 'RUNNING'").fetchone()[0]
        agents = conn.execute("SELECT COUNT(*) FROM agents WHERE state != 'OFFLINE'").fetchone()[0]
    return {
        "ok": True,
        "environment": "simulation",
        "now": c.clock.now(),
        "history_start": c.history_start,
        "warming_up": c.warming_up,
        "ticks": c.ticks,
        "errors": c.errors,
        "running_campaigns": running,
        "agents_online": agents,
        "providers": {name: _provider_status(c, name) for name in c.providers},
    }


def _provider_status(c, name: str, error_rate: float | None = None) -> str:
    fault = c.faults.get(name)
    if c.providers[name].outage == "down":
        return "outage"
    if fault or (error_rate is not None and error_rate > c.settings.safety.provider_max_error_rate / 2):
        return "degraded"
    return "operational"


# ---- overview -----------------------------------------------------------------


def overview(c, campaign_id: int | None, since: float) -> dict:
    now = c.clock.now()
    start = now - since
    cf, ca = _camp("c.campaign_id", campaign_id)
    with c.db.read() as conn:
        funnel = _funnel(conn, start, cf, ca)
        direct = dict(conn.execute(
            "SELECT COUNT(*) AS attempts, COALESCE(SUM(answered_at IS NOT NULL), 0) AS answered,"
            "       COALESCE(SUM(connected_at IS NOT NULL), 0) AS connected"
            f" FROM calls c WHERE screening = 0 AND sending_at >= ?{cf}",
            [start, *ca],
        ).fetchone())
        agents = _agent_counts(conn)
        util = conn.execute(
            "SELECT SUM(connected) AS talking, SUM(available + reserved + dialing + connected + wrap_up + paused)"
            " AS staffed FROM agent_samples WHERE at >= ?",
            (start,),
        ).fetchone()
        series = _activity_series(conn, now, start, cf, ca)
        system = _system_health(c, conn, now, start, campaign_id)
        feed = activity_feed(conn, start, campaign_id, limit=8)
    utilization = util["talking"] / util["staffed"] if util["staffed"] else None
    return {
        "now": now,
        "since": since,
        "campaign_id": campaign_id,
        "kpis": {
            "screening_attempts": funnel["attempts"],
            "willing": funnel["willing"],
            "connected": funnel["connected"],
            "utilization": _round(utilization, 4),
            "direct_attempts": direct["attempts"],
            "direct_connected": direct["connected"],
        },
        "funnel": funnel,
        "direct": direct,
        "agents": agents,
        "activity": series,
        "system": system,
        "recent": feed,
    }


def _funnel(conn, start: float, cf: str, ca: list) -> dict:
    row = conn.execute(
        "SELECT COUNT(*) AS attempts,"
        "  COALESCE(SUM(answered_at IS NOT NULL), 0) AS answered,"
        "  COALESCE(SUM(screen_result = 'willing'), 0) AS willing,"
        "  COALESCE(SUM(connected_at IS NOT NULL), 0) AS connected,"
        "  COALESCE(SUM(screen_result = 'declined'), 0) AS declined,"
        "  COALESCE(SUM(screen_result = 'unavailable'), 0) AS callback_later,"
        "  COALESCE(SUM(screen_result = 'failed' OR end_reason = 'screen_failed'), 0) AS screening_failed,"
        "  COALESCE(SUM(end_reason = 'no_answer'), 0) AS no_answer,"
        "  COALESCE(SUM(end_reason = 'busy'), 0) AS busy,"
        "  COALESCE(SUM(screen_result = 'willing' AND connected_at IS NULL"
        f"      AND state IN {_IN_TERMINAL}), 0) AS willing_not_connected,"
        "  COALESCE(SUM(end_reason = 'no_agent_transfer'), 0) AS no_agent_in_time,"
        "  COALESCE(SUM(end_reason = 'caller_left_hold'), 0) AS left_hold,"
        "  COALESCE(SUM(state = 'TRANSFER_PENDING' AND agent_id IS NULL), 0) AS waiting,"
        "  COALESCE(SUM(state = 'TRANSFER_PENDING' AND agent_id IS NOT NULL), 0) AS transferring,"
        f"  COALESCE(SUM(state IN ('RESERVED', 'INITIATED', 'RINGING', 'ANSWERED', 'SCREENING')), 0) AS in_progress,"
        "  AVG(CASE WHEN screen_result_at IS NOT NULL AND answered_at IS NOT NULL"
        "      THEN screen_result_at - answered_at END) AS avg_bot_s,"
        "  AVG(CASE WHEN connected_at IS NOT NULL THEN connected_at - transfer_requested_at END) AS avg_hold_s"
        f" FROM calls c WHERE screening = 1 AND sending_at >= ?{cf}",
        [start, *ca],
    ).fetchone()
    out = dict(row)
    out["avg_bot_s"] = _round(out["avg_bot_s"])
    out["avg_hold_s"] = _round(out["avg_hold_s"])
    return out


def _agent_counts(conn) -> dict:
    counts = dict(conn.execute("SELECT state, COUNT(*) FROM agents GROUP BY state").fetchall())
    states = ("AVAILABLE", "RESERVED", "DIALING", "CONNECTED", "WRAP_UP", "PAUSED", "OFFLINE")
    out = {s: counts.get(s, 0) for s in states}
    out["total"] = sum(out.values())
    return out


def _bucket(span: float) -> int:
    for size in (60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600):
        if span / size <= 24:
            return size
    return 43200


def _activity_series(conn, now: float, start: float, cf: str, ca: list) -> dict:
    first = conn.execute(f"SELECT MIN(sending_at) FROM calls c WHERE sending_at >= ?{cf}", [start, *ca]).fetchone()[0]
    origin_raw = max(start, first) if first is not None else max(start, now - 600)
    size = _bucket(now - origin_raw)
    origin = math.floor(origin_raw / size) * size
    n = int((now - origin) // size) + 1
    points = [{"t": origin + i * size, "attempts": 0, "screening_attempts": 0, "connected": 0, "willing": 0}
              for i in range(n)]

    def fill(column: str, key: str, extra: str = ""):
        for b, count in conn.execute(
            f"SELECT CAST(({column} - ?) / ? AS INTEGER) AS b, COUNT(*) FROM calls c"
            f" WHERE {column} >= ?{extra}{cf} GROUP BY b",
            [origin, size, origin, *ca],
        ):
            if 0 <= b < n:
                points[b][key] = count

    fill("sending_at", "attempts")
    fill("sending_at", "screening_attempts", " AND screening = 1")
    fill("connected_at", "connected")
    fill("screen_result_at", "willing", " AND screen_result = 'willing'")
    return {"bucket_s": size, "points": points}


def _latest_decisions(conn, campaign_id: int | None = None) -> list:
    cf, ca = _camp("d.campaign_id", campaign_id)
    return conn.execute(
        "SELECT d.*, k.name AS campaign_name, k.status AS campaign_status FROM decisions d"
        " JOIN campaigns k ON k.id = d.campaign_id"
        " WHERE d.id IN (SELECT MAX(id) FROM decisions GROUP BY campaign_id)"
        f"   AND k.status = 'RUNNING'{cf} ORDER BY d.campaign_id",
        ca,
    ).fetchall()


def safety_status(rows) -> str:
    if not rows:
        return "idle"
    reasons = " ".join(r["safety_reasons"] or "" for r in rows)
    actions = {r["action"] for r in rows}
    if "provider_unhealthy" in reasons:
        return "provider_unavailable"
    if "FORCE_PROGRESSIVE" in actions:
        return "forced_progressive"
    if actions & {"REJECT", "REDUCE"} and any(r["requested"] for r in rows):
        return "restricted"
    return "operational"


def _system_health(c, conn, now: float, start: float, campaign_id: int | None) -> dict:
    cf, ca = _camp("campaign_id", campaign_id)
    latest = _latest_decisions(conn, campaign_id)
    actions = dict(conn.execute(
        f"SELECT action, COUNT(*) FROM decisions WHERE at >= ?{cf} GROUP BY action", [start, *ca]
    ).fetchall())
    backlog = conn.execute(
        "SELECT COUNT(*) FROM calls WHERE screening = 1"
        f" AND state IN ('RESERVED', 'INITIATED', 'RINGING', 'ANSWERED', 'SCREENING'){cf}",
        ca,
    ).fetchone()[0]
    waiting = conn.execute(
        f"SELECT COUNT(*), MIN(transfer_requested_at) FROM calls WHERE state = 'TRANSFER_PENDING' AND agent_id IS NULL{cf}",
        ca,
    ).fetchone()
    transferring = conn.execute(
        f"SELECT COUNT(*) FROM calls WHERE state = 'TRANSFER_PENDING' AND agent_id IS NOT NULL{cf}", ca
    ).fetchone()[0]
    recovery = conn.execute(
        "SELECT COUNT(*) AS n, MAX(at) AS last_at FROM recovery_log WHERE at >= ?", (start,)
    ).fetchone()
    last_recovery = conn.execute("SELECT action, detail, at FROM recovery_log ORDER BY id DESC LIMIT 1").fetchone()
    errors = _provider_error_rates(c, conn, now)
    return {
        "safety": {
            "status": safety_status(latest),
            "campaigns": [_decision_brief(r) for r in latest],
            "actions": actions,
        },
        "providers": [
            {"name": n, "status": _provider_status(c, n, errors[n]["rate"]), "fault": c.faults.get(n),
             "error_rate": errors[n]["rate"], "requests_60s": errors[n]["requests"]}
            for n in c.providers
        ],
        "screening_backlog": backlog,
        "pending_transfers": waiting[0],
        "longest_wait_s": _round(now - waiting[1]) if waiting[1] else None,
        "transfers_in_progress": transferring,
        "recovery": {
            "count": recovery["n"],
            "last": dict(last_recovery) if last_recovery else None,
        },
    }


def _provider_error_rates(c, conn, now: float) -> dict:
    window = c.settings.safety.provider_window_s
    out = {n: {"requests": 0, "errors": 0, "rate": 0.0} for n in c.providers}
    for row in conn.execute(
        "SELECT provider, COUNT(*) AS n, SUM(result IN ('rejected', 'timeout')) AS bad FROM provider_requests"
        " WHERE sent_at >= ? AND result IS NOT NULL GROUP BY provider",
        (now - window,),
    ):
        if row["provider"] in out:
            out[row["provider"]] = {"requests": row["n"], "errors": row["bad"],
                                    "rate": round(row["bad"] / row["n"], 4) if row["n"] else 0.0}
    return out


def _decision_brief(r) -> dict:
    return {
        "id": r["id"], "code": f"DEC-{r['id']}", "campaign_id": r["campaign_id"],
        "campaign": r["campaign_name"], "at": r["at"], "action": r["action"], "mode": r["mode"],
        "requested": r["requested"], "approved": r["approved"],
        "reasons": json.loads(r["safety_reasons"]) if r["safety_reasons"] else [],
    }


def activity_feed(conn, start: float, campaign_id: int | None = None, limit: int = 20,
                  agent_id: int | None = None) -> list[dict]:
    """Notable things that happened, newest first: screening results, transfers,
    calls ending, recovery actions, safety changes and operator actions."""
    cf, ca = _camp("c.campaign_id", campaign_id)
    af, aa = _camp("c.agent_id", agent_id)
    items: list[dict] = []
    base = (
        "SELECT c.id, c.campaign_id, k.name AS campaign, c.agent_id, a.name AS agent, c.screening,"
        " c.screen_result, c.end_reason, c.state, c.talk_seconds, c.provider, {col} AS at"
        " FROM calls c JOIN campaigns k ON k.id = c.campaign_id LEFT JOIN agents a ON a.id = c.agent_id"
        " WHERE {col} >= ?{extra}" + cf + af + " ORDER BY {col} DESC LIMIT ?"
    )
    for row in conn.execute(base.format(col="c.screen_result_at", extra=""), [start, *ca, *aa, limit]):
        items.append(_feed_call(row, "screening_outcome", row["screen_result"]))
    for row in conn.execute(base.format(col="c.connected_at", extra=""), [start, *ca, *aa, limit]):
        items.append(_feed_call(row, "transfer_confirmed" if row["screening"] else "agent_connected", "connected"))
    for row in conn.execute(
        base.format(col="c.ended_at", extra=" AND c.state = 'ABANDONED'"), [start, *ca, *aa, limit]
    ):
        items.append(_feed_call(row, "call_abandoned", "abandoned"))
    if agent_id:
        for row in conn.execute(
            base.format(col="c.ended_at", extra=" AND c.connected_at IS NOT NULL"), [start, *ca, *aa, limit]
        ):
            items.append(_feed_call(row, "call_ended", row["end_reason"]))
    rf, ra = _camp("c.campaign_id", campaign_id)
    for row in conn.execute(
        "SELECT r.*, c.campaign_id, k.name AS campaign FROM recovery_log r"
        " LEFT JOIN calls c ON c.id = r.call_id LEFT JOIN campaigns k ON k.id = c.campaign_id"
        f" WHERE r.at >= ?{rf}" + (" AND r.agent_id = ?" if agent_id else "") + " ORDER BY r.id DESC LIMIT ?",
        [start, *ra, *([agent_id] if agent_id else []), limit],
    ):
        items.append({
            "at": row["at"], "kind": "recovery", "result": row["action"], "detail": row["detail"],
            "campaign_id": row["campaign_id"], "campaign": row["campaign"],
            "call_id": row["call_id"], "call": call_code(row["call_id"]),
            "agent_id": row["agent_id"], "id": f"REC-{row['id']}",
        })
    if not agent_id:
        df, da = _camp("d.campaign_id", campaign_id)
        # only decisions where the action changed, otherwise a cold start is one row per second
        for row in conn.execute(_CHANGES + " SELECT d.*, k.name AS campaign FROM d JOIN campaigns k ON k.id = d.campaign_id"
                                f" WHERE d.at >= ? AND (d.prev IS NULL OR d.prev != d.action){df} ORDER BY d.id DESC LIMIT ?",
                                [start - _LOOKBACK, start, *da, limit]):
            reasons = json.loads(row["safety_reasons"]) if row["safety_reasons"] else []
            items.append({
                "at": row["at"], "kind": "safety_decision", "result": row["action"],
                "detail": reasons[0] if reasons else row["reasoning"],
                "campaign_id": row["campaign_id"], "campaign": row["campaign"], "id": f"DEC-{row['id']}",
                "requested": row["requested"], "approved": row["approved"],
            })
    subjects = []
    if campaign_id:
        subjects.append(f"campaign:{campaign_id}")
    if agent_id:
        subjects.append(f"agent:{agent_id}")
    sf = f" AND subject IN ({', '.join('?' * len(subjects))})" if subjects else ""
    for row in conn.execute(
        f"SELECT * FROM audit_log WHERE at >= ?{sf} ORDER BY id DESC LIMIT ?", [start, *subjects, limit]
    ):
        items.append({
            "at": row["at"], "kind": "operator", "result": row["action"], "detail": row["detail"],
            "subject": row["subject"], "id": f"OPS-{row['id']}",
            **_subject_names(conn, row["subject"]),
        })
    items.sort(key=lambda i: i["at"], reverse=True)
    return items[:limit]


# decisions with the previous action of the same campaign. Only looks back a bounded
# stretch before the window; the first decision of a campaign in that stretch counts
# as a change, which is fine for a feed
_LOOKBACK = 600
_CHANGES = ("WITH d AS (SELECT d.*, LAG(action) OVER (PARTITION BY campaign_id ORDER BY id) AS prev"
            " FROM decisions d WHERE d.at >= ?)")


def _feed_call(row, kind: str, result) -> dict:
    return {
        "at": row["at"], "kind": kind, "result": result,
        "campaign_id": row["campaign_id"], "campaign": row["campaign"],
        "call_id": row["id"], "call": call_code(row["id"]),
        "agent_id": row["agent_id"], "agent": row["agent"], "provider": row["provider"],
        "talk_seconds": _round(row["talk_seconds"]), "end_reason": row["end_reason"],
    }


def _subject_names(conn, subject: str | None) -> dict:
    if not subject or ":" not in subject:
        return {}
    kind, _, raw = subject.partition(":")
    if kind == "campaign" and raw.isdigit():
        row = conn.execute("SELECT name FROM campaigns WHERE id = ?", (int(raw),)).fetchone()
        return {"campaign_id": int(raw), "campaign": row["name"] if row else None}
    if kind == "agent" and raw.isdigit():
        row = conn.execute("SELECT name FROM agents WHERE id = ?", (int(raw),)).fetchone()
        return {"agent_id": int(raw), "agent": row["name"] if row else None}
    if kind == "provider":
        return {"provider": raw}
    return {}


# ---- agents -------------------------------------------------------------------


def agents(c, since: float) -> dict:
    now = c.clock.now()
    start = now - since
    with c.db.read() as conn:
        rows = conn.execute(
            "SELECT a.*, c.state AS call_state, c.campaign_id AS call_campaign_id, k.name AS call_campaign,"
            "   c.screening AS call_screening, c.connected_at AS call_connected_at, c.reserved_at AS call_reserved_at,"
            "   c.transfer_requested_at AS call_transfer_at"
            " FROM agents a LEFT JOIN calls c ON c.id = a.current_call_id"
            " LEFT JOIN campaigns k ON k.id = c.campaign_id ORDER BY a.id"
        ).fetchall()
        stats = {r["agent_id"]: r for r in conn.execute(
            "SELECT agent_id, COUNT(*) AS calls, COALESCE(SUM(talk_seconds), 0) AS talk_s,"
            "   MAX(COALESCE(ended_at, connected_at)) AS last_call_at"
            " FROM calls WHERE agent_id IS NOT NULL AND connected_at >= ? GROUP BY agent_id",
            (start,),
        )}
        last_campaign = {r["agent_id"]: r for r in conn.execute(
            "SELECT agent_id, campaign_id, name FROM ("
            "  SELECT c.agent_id, c.campaign_id, k.name, ROW_NUMBER() OVER ("
            "    PARTITION BY c.agent_id ORDER BY COALESCE(c.connected_at, c.reserved_at, c.created_at) DESC) AS rn"
            "  FROM calls c JOIN campaigns k ON k.id = c.campaign_id WHERE c.agent_id IS NOT NULL)"
            " WHERE rn = 1"
        )}
        campaigns = [dict(r) for r in conn.execute("SELECT id, name, status FROM campaigns ORDER BY id")]
        counts = _agent_counts(conn)
    items = []
    for r in rows:
        s = stats.get(r["id"])
        last = last_campaign.get(r["id"])
        call = None
        if r["current_call_id"]:
            call = {
                "id": r["current_call_id"], "code": call_code(r["current_call_id"]), "state": r["call_state"],
                "campaign_id": r["call_campaign_id"], "campaign": r["call_campaign"],
                "screening": bool(r["call_screening"]), "connected_at": r["call_connected_at"],
                "reserved_at": r["call_reserved_at"],
            }
        last_call_at = s["last_call_at"] if s else None
        items.append({
            "id": r["id"], "code": agent_code(r["id"]), "name": r["name"], "state": r["state"],
            "state_since": r["updated_at"], "wrap_up_until": r["wrap_up_until"],
            "pause_requested": bool(r["pause_requested"]),
            "call": call,
            "campaign": ({"id": call["campaign_id"], "name": call["campaign"]} if call
                         else ({"id": last["campaign_id"], "name": last["name"]} if last else None)),
            "campaign_is_current": call is not None,
            "calls": s["calls"] if s else 0,
            "talk_s": _round(s["talk_s"]) if s else 0,
            "last_activity": max(filter(None, [r["updated_at"], last_call_at])),
        })
    return {"now": now, "since": since, "summary": counts, "agents": items, "campaigns": campaigns}


def agent(c, agent_id: int, since: float) -> dict:
    now = c.clock.now()
    data = agents(c, since)
    match = next((a for a in data["agents"] if a["id"] == agent_id), None)
    if match is None:
        raise KeyError(f"agent {agent_id} not found")
    with c.db.read() as conn:
        calls = [_call_row(r) for r in conn.execute(
            f"SELECT c.*, k.name AS campaign_name, a.name AS agent_name, b.name AS borrower_name, b.phone,"
            f" {OUTCOME_SQL} AS outcome"
            " FROM calls c JOIN campaigns k ON k.id = c.campaign_id LEFT JOIN agents a ON a.id = c.agent_id"
            " JOIN borrowers b ON b.id = c.borrower_id WHERE c.agent_id = ?"
            " ORDER BY COALESCE(c.connected_at, c.reserved_at, c.created_at) DESC LIMIT 15",
            (agent_id,),
        )]
        feed = activity_feed(conn, now - since, agent_id=agent_id, limit=20)
        avg = conn.execute(
            "SELECT AVG(talk_seconds) FROM calls WHERE agent_id = ? AND connected_at >= ? AND talk_seconds IS NOT NULL",
            (agent_id, now - since),
        ).fetchone()[0]
    return {"now": now, "agent": {**match, "avg_talk_s": _round(avg)}, "calls": calls, "activity": feed}


# ---- campaigns ----------------------------------------------------------------


def campaigns(c) -> dict:
    now = c.clock.now()
    with c.db.read() as conn:
        rows = conn.execute(
            "SELECT k.*, COALESCE(b.targets, 0) AS targets, COALESCE(b.resolved, 0) AS resolved,"
            "   COALESCE(s.attempts, 0) AS attempts, COALESCE(s.answered, 0) AS answered,"
            "   COALESCE(s.connected, 0) AS connected, COALESCE(s.willing, 0) AS willing,"
            "   COALESCE(s.queued, 0) AS queued, COALESCE(s.live, 0) AS live,"
            "   COALESCE(s.abandoned, 0) AS abandoned, s.last_activity"
            " FROM campaigns k"
            " LEFT JOIN (SELECT campaign_id, COUNT(*) AS targets, SUM(outcome IS NOT NULL) AS resolved"
            "            FROM borrowers GROUP BY campaign_id) b ON b.campaign_id = k.id"
            " LEFT JOIN (SELECT campaign_id, SUM(sending_at IS NOT NULL) AS attempts,"
            "            SUM(answered_at IS NOT NULL) AS answered, SUM(connected_at IS NOT NULL) AS connected,"
            "            SUM(screen_result = 'willing') AS willing, SUM(state = 'QUEUED') AS queued,"
            f"           SUM(state IN {_IN_LIVE}) AS live, SUM(state = 'ABANDONED') AS abandoned,"
            "            MAX(updated_at) AS last_activity FROM calls GROUP BY campaign_id) s ON s.campaign_id = k.id"
            " ORDER BY k.id"
        ).fetchall()
        latest = {r["campaign_id"]: _decision_brief(r) for r in conn.execute(
            "SELECT d.*, k.name AS campaign_name FROM decisions d JOIN campaigns k ON k.id = d.campaign_id"
            " WHERE d.id IN (SELECT MAX(id) FROM decisions GROUP BY campaign_id)"
        )}
    items = [_campaign_row(r, latest.get(r["id"])) for r in rows]
    summary = {"total": len(items)}
    for key in ("RUNNING", "PAUSED", "STOPPED", "COMPLETED"):
        summary[key.lower()] = sum(1 for i in items if i["display_status"] == key)
    summary["targets_remaining"] = sum(i["queued"] for i in items if i["display_status"] == "RUNNING")
    return {"now": now, "summary": summary, "campaigns": items, "audiences": _audiences(),
            "agent_pool": _pool(c)}


def _campaign_row(r, last_decision) -> dict:
    status = r["status"]
    if status != "STOPPED" and r["queued"] == 0 and r["live"] == 0 and r["attempts"] > 0:
        display = "COMPLETED"
    else:
        display = status
    return {
        "id": r["id"], "code": campaign_code(r["id"]), "name": r["name"], "description": r["description"],
        "status": status, "display_status": display, "mode": r["mode"], "provider": r["provider"],
        "screening": bool(r["screening"]), "audience": r["audience"], "hold_s": r["hold_s"],
        "no_agent_policy": r["no_agent_policy"], "max_attempts": r["max_attempts"],
        "targets": r["targets"], "resolved": r["resolved"], "attempts": r["attempts"],
        "answered": r["answered"], "connected": r["connected"], "willing": r["willing"],
        "queued": r["queued"], "live": r["live"], "abandoned": r["abandoned"],
        "created_at": r["created_at"], "updated_at": r["updated_at"],
        "last_activity": max(filter(None, [r["updated_at"], r["last_activity"]]), default=None),
        "last_decision": last_decision,
    }


def _audiences() -> dict:
    from .console import AUDIENCES
    return AUDIENCES


def _pool(c) -> dict:
    with c.db.read() as conn:
        total, online = conn.execute(
            "SELECT COUNT(*), COALESCE(SUM(state != 'OFFLINE'), 0) FROM agents"
        ).fetchone()
    return {"name": "Shared agent pool", "agents": total, "online": online,
            "note": "All campaigns draw from one shared pool of agents."}


def campaign(c, campaign_id: int, since: float) -> dict:
    data = campaigns(c)
    match = next((x for x in data["campaigns"] if x["id"] == campaign_id), None)
    if match is None:
        raise KeyError(f"campaign {campaign_id} not found")
    now = c.clock.now()
    metrics = campaign_metrics(c.db, campaign_id)
    with c.db.read() as conn:
        feed = activity_feed(conn, now - since, campaign_id=campaign_id, limit=15)
    settings = c.settings.screening
    return {
        "now": now,
        "campaign": match,
        "metrics": metrics,
        "screening_settings": {
            "hold_s": match["hold_s"] or settings.hold_s,
            "no_agent_policy": match["no_agent_policy"] or settings.no_agent_policy,
            "hold_is_default": match["hold_s"] is None,
            "policy_is_default": match["no_agent_policy"] is None,
        },
        "agent_pool": data["agent_pool"],
        "activity": feed,
    }


# ---- calls --------------------------------------------------------------------


def calls(c, campaign_id=None, state=None, outcome=None, provider=None, q=None, scope="recent",
          since: float = 3600, limit: int = 100) -> dict:
    now = c.clock.now()
    where, args = [], []
    if state == "QUEUED":
        where.append("c.state = 'QUEUED'")
    elif state:
        where.append("c.state = ?")
        args.append(state)
    elif scope == "live":
        where.append(f"c.state IN {_IN_LIVE}")
    else:
        where.append(f"(c.state IN {_IN_LIVE} OR c.ended_at >= ?)")
        args.append(now - since)
    for col, val in (("c.campaign_id", campaign_id), ("c.provider", provider)):
        if val:
            where.append(f"{col} = ?")
            args.append(val)
    if outcome:
        where.append(f"({OUTCOME_SQL}) = ?")
        args.append(outcome)
    if q:
        term = q.strip().upper().removeprefix("CALL-")
        if term.isdigit():
            where.append("(c.id = ? OR c.id = ?)")
            args += [int(term), int(term) - 10000]
        else:
            where.append("(k.name LIKE ? OR a.name LIKE ?)")
            args += [f"%{q}%", f"%{q}%"]
    sql = (
        f"SELECT c.*, k.name AS campaign_name, a.name AS agent_name, b.name AS borrower_name, b.phone,"
        f" {OUTCOME_SQL} AS outcome FROM calls c JOIN campaigns k ON k.id = c.campaign_id"
        " LEFT JOIN agents a ON a.id = c.agent_id JOIN borrowers b ON b.id = c.borrower_id"
        f" WHERE {' AND '.join(where)}"
        f" ORDER BY (c.state IN {_IN_LIVE}) DESC, COALESCE(c.ended_at, c.updated_at) DESC LIMIT ?"
    )
    with c.db.read() as conn:
        rows = [_call_row(r) for r in conn.execute(sql, [*args, limit])]
        cf, ca = _camp("campaign_id", campaign_id)
        state_counts = dict(conn.execute(
            f"SELECT state, COUNT(*) FROM calls WHERE (state IN {_IN_LIVE} OR ended_at >= ?){cf} GROUP BY state",
            [now - since, *ca],
        ).fetchall())
        queued = conn.execute(f"SELECT COUNT(*) FROM calls WHERE state = 'QUEUED'{cf}", ca).fetchone()[0]
    return {"now": now, "calls": rows, "state_counts": state_counts, "queued": queued}


def _call_row(r) -> dict:
    keys = r.keys()
    return {
        "id": r["id"], "code": call_code(r["id"]),
        "campaign_id": r["campaign_id"], "campaign": r["campaign_name"],
        "agent_id": r["agent_id"], "agent_code": agent_code(r["agent_id"]), "agent": r["agent_name"],
        "borrower": r["borrower_name"], "phone": _mask(r["phone"]),
        "state": r["state"], "screening": bool(r["screening"]), "bound": bool(r["bound"]),
        "outcome": r["outcome"] if "outcome" in keys else None,
        "screen_result": r["screen_result"], "provider": r["provider"],
        "initiation": r["initiation"], "transfer_status": r["transfer_status"],
        "attempt": r["attempt"], "end_reason": r["end_reason"], "talk_seconds": _round(r["talk_seconds"]),
        "created_at": r["created_at"], "reserved_at": r["reserved_at"], "sending_at": r["sending_at"],
        "initiated_at": r["initiated_at"], "answered_at": r["answered_at"],
        "screen_result_at": r["screen_result_at"], "transfer_requested_at": r["transfer_requested_at"],
        "hold_until": r["hold_until"], "connected_at": r["connected_at"], "ended_at": r["ended_at"],
        "last_event_at": r["last_event_at"], "updated_at": r["updated_at"],
    }


def call(c, call_id: int) -> dict:
    with c.db.read() as conn:
        row = conn.execute(
            f"SELECT c.*, k.name AS campaign_name, a.name AS agent_name, b.name AS borrower_name, b.phone,"
            f" {OUTCOME_SQL} AS outcome FROM calls c JOIN campaigns k ON k.id = c.campaign_id"
            " LEFT JOIN agents a ON a.id = c.agent_id JOIN borrowers b ON b.id = c.borrower_id WHERE c.id = ?",
            (call_id,),
        ).fetchone()
        if row is None:
            raise KeyError(f"call {call_id} not found")
        events = [_event_row(e) for e in conn.execute(
            "SELECT e.*, NULL AS campaign_id, NULL AS campaign_name FROM provider_events e"
            " WHERE e.call_id = ? OR (e.dial_token IS NOT NULL AND e.dial_token = ?) ORDER BY e.received_at, e.rowid",
            (call_id, row["dial_token"]),
        )]
        requests = [dict(r) for r in conn.execute(
            "SELECT id, provider, sent_at, result, error FROM provider_requests WHERE call_id = ? ORDER BY id",
            (call_id,),
        )]
        recovery = [_recovery_row(r) for r in conn.execute(
            "SELECT r.*, NULL AS campaign_id, NULL AS campaign FROM recovery_log r WHERE r.call_id = ? ORDER BY r.id",
            (call_id,),
        )]
        attempts = [{"id": r["id"], "code": call_code(r["id"]), "attempt": r["attempt"], "state": r["state"],
                     "end_reason": r["end_reason"], "created_at": r["created_at"]}
                    for r in conn.execute(
                        "SELECT id, attempt, state, end_reason, created_at FROM calls WHERE borrower_id = ?"
                        " ORDER BY attempt", (row["borrower_id"],))]
    return {"now": c.clock.now(), "call": _call_row(row), "events": events, "requests": requests,
            "recovery": recovery, "attempts": attempts}


# ---- live operations ----------------------------------------------------------


def live(c, campaign_id: int | None, since: float) -> dict:
    now = c.clock.now()
    start = now - since
    cf, ca = _camp("c.campaign_id", campaign_id)
    with c.db.read() as conn:
        states = dict(conn.execute(
            f"SELECT state || ':' || screening, COUNT(*) FROM calls c WHERE state IN {_IN_LIVE}{cf}"
            " GROUP BY state, screening", ca
        ).fetchall())
        waiting = conn.execute(
            "SELECT COUNT(*), MIN(transfer_requested_at) FROM calls c"
            f" WHERE state = 'TRANSFER_PENDING' AND agent_id IS NULL{cf}", ca
        ).fetchone()
        connected_window = conn.execute(
            f"SELECT COUNT(*) FROM calls c WHERE connected_at >= ?{cf}", [start, *ca]
        ).fetchone()[0]
        df, da = _camp("campaign_id", campaign_id)
        decisions = dict(conn.execute(
            f"SELECT action, COUNT(*) FROM decisions WHERE at >= ?{df} GROUP BY action", [start, *da]
        ).fetchall())
        queued = conn.execute(f"SELECT COUNT(*) FROM calls c WHERE state = 'QUEUED'{cf}", ca).fetchone()[0]
        funnel = _funnel(conn, start, cf, ca)
        alerts = _alerts(c, conn, now, campaign_id)
        latest = _latest_decisions(conn, campaign_id)

    def n(state, screening=None):
        if screening is None:
            return states.get(f"{state}:0", 0) + states.get(f"{state}:1", 0)
        return states.get(f"{state}:{int(screening)}", 0)

    return {
        "now": now,
        "since": since,
        "kpis": {
            "screening_dialing": n("RESERVED", True) + n("INITIATED", True) + n("RINGING", True),
            "screening_active": n("ANSWERED", True) + n("SCREENING", True),
            "waiting_for_agent": waiting[0],
            "longest_wait_s": _round(now - waiting[1]) if waiting[1] else None,
            "transferring": n("TRANSFER_PENDING") - waiting[0],
            "connected_now": n("CONNECTED"),
            "live_calls": sum(states.values()),
            "queued": queued,
            "connected": connected_window,
            "safety_blocks": decisions.get("REJECT", 0),
            "safety_adjustments": decisions.get("REDUCE", 0) + decisions.get("FORCE_PROGRESSIVE", 0),
        },
        "states": {s: n(s) for s in LIVE},
        "pipeline": funnel,
        "safety": {"status": safety_status(latest), "campaigns": [_decision_brief(r) for r in latest]},
        "alerts": alerts,
    }


def _alerts(c, conn, now: float, campaign_id: int | None) -> list[dict]:
    """What an operator should look at right now, worst first."""
    cf, ca = _camp("c.campaign_id", campaign_id)
    alerts = []
    for name, fault in c.faults.items():
        level = "error" if fault["kind"] == "outage" else "warning"
        alerts.append({"level": level, "kind": "provider_fault", "provider": name, "at": fault["started_at"],
                       "title": f"Provider {name}: {fault['label'].lower()}",
                       "detail": "Injected from Provider Monitoring" + (
                           f", ends in {max(0, fault['until'] - now):.0f}s" if fault["until"] else "")})
    for r in _latest_decisions(conn, campaign_id):
        reasons = json.loads(r["safety_reasons"]) if r["safety_reasons"] else []
        if any(x.startswith("provider_unhealthy") for x in reasons):
            alerts.append({"level": "error", "kind": "safety", "campaign_id": r["campaign_id"], "at": r["at"],
                           "title": f"New calls blocked for {r['campaign_name']}", "detail": reasons[0]})
        elif r["action"] in ("REJECT", "FORCE_PROGRESSIVE", "REDUCE") and reasons:
            alerts.append({"level": "info", "kind": "safety", "campaign_id": r["campaign_id"], "at": r["at"],
                           "title": f"Safety controller: {r['action'].replace('_', ' ').lower()}"
                                    f" for {r['campaign_name']}", "detail": reasons[0]})
    waiting = conn.execute(
        "SELECT c.id, c.transfer_requested_at, c.hold_until, k.name FROM calls c JOIN campaigns k ON k.id = c.campaign_id"
        f" WHERE c.state = 'TRANSFER_PENDING' AND c.agent_id IS NULL{cf} ORDER BY c.transfer_requested_at", ca
    ).fetchall()
    if waiting:
        w = waiting[0]
        alerts.append({"level": "warning", "kind": "waiting", "call_id": w["id"], "at": w["transfer_requested_at"],
                       "title": f"{len(waiting)} willing borrower{'s' if len(waiting) > 1 else ''} waiting for an agent",
                       "detail": f"{call_code(w['id'])} ({w['name']}) has waited "
                                 f"{now - w['transfer_requested_at']:.0f}s, gives up in {max(0, w['hold_until'] - now):.0f}s"})
    ambiguous = conn.execute(
        "SELECT COUNT(*), MIN(c.sending_at) FROM calls c WHERE c.state = 'RESERVED'"
        f" AND c.initiation IN ('SENDING', 'UNKNOWN'){cf}", ca
    ).fetchone()
    if ambiguous[0]:
        alerts.append({"level": "warning", "kind": "reconciliation", "at": ambiguous[1],
                       "title": f"{ambiguous[0]} call request{'s' if ambiguous[0] > 1 else ''} awaiting reconciliation",
                       "detail": "The provider didn't answer in time; recovery will look the request up by token "
                                 "instead of dialing again"})
    abandoned = conn.execute(
        f"SELECT COUNT(*), MAX(c.ended_at) FROM calls c WHERE c.state = 'ABANDONED' AND c.ended_at >= ?{cf}",
        [now - 900, *ca],
    ).fetchone()
    if abandoned[0]:
        alerts.append({"level": "warning", "kind": "abandoned", "at": abandoned[1],
                       "title": f"{abandoned[0]} abandoned call{'s' if abandoned[0] > 1 else ''} in the last 15 minutes",
                       "detail": "Answered with no free agent; counted against the abandon-rate limit"})
    dup = conn.execute(
        "SELECT COALESCE(SUM(deliveries - 1), 0), MAX(received_at) FROM provider_events WHERE received_at >= ?"
        " AND deliveries > 1", (now - 300,)
    ).fetchone()
    if dup[0]:
        alerts.append({"level": "info", "kind": "duplicates", "at": dup[1],
                       "title": f"{dup[0]} duplicate provider event{'s' if dup[0] > 1 else ''} ignored (last 5 min)",
                       "detail": "Matched an event id already stored, so nothing was applied twice"})
    order = conn.execute(
        "SELECT COUNT(*), MAX(received_at) FROM provider_events WHERE received_at >= ? AND outcome IN ('stale', 'late')"
        f" AND NOT {_redundant()}",
        (now - 300,),
    ).fetchone()
    if order[0]:
        alerts.append({"level": "info", "kind": "out_of_order", "at": order[1],
                       "title": f"{order[0]} out-of-order or late event{'s' if order[0] > 1 else ''} recorded (last 5 min)",
                       "detail": "Recorded without moving any call backwards"})
    rec = conn.execute("SELECT COUNT(*), MAX(at) FROM recovery_log WHERE at >= ?", (now - 300,)).fetchone()
    if rec[0]:
        alerts.append({"level": "info", "kind": "recovery", "at": rec[1],
                       "title": f"{rec[0]} recovery action{'s' if rec[0] > 1 else ''} in the last 5 minutes",
                       "detail": "See Event Logs & Recovery for what was reconciled"})
    rank = {"error": 0, "warning": 1, "info": 2}
    alerts.sort(key=lambda a: (rank[a["level"]], -(a.get("at") or 0)))
    return alerts


# ---- pacing and safety --------------------------------------------------------


def pacing(c, campaign_id: int | None, since: float) -> dict:
    now = c.clock.now()
    with c.db.read() as conn:
        camps = [dict(r) for r in conn.execute(
            "SELECT id, name, mode, status, screening, provider FROM campaigns ORDER BY (status = 'RUNNING') DESC, id"
        )]
    if not camps:
        return {"now": now, "campaigns": [], "selected": None}
    if campaign_id is None or not any(x["id"] == campaign_id for x in camps):
        campaign_id = camps[0]["id"]
    selected = next(x for x in camps if x["id"] == campaign_id)
    snap = take_snapshot(c.db, c.clock, c.settings, campaign_id)
    with c.db.read() as conn:
        latest = conn.execute(
            "SELECT d.*, k.name AS campaign_name FROM decisions d JOIN campaigns k ON k.id = d.campaign_id"
            " WHERE d.campaign_id = ? ORDER BY d.id DESC LIMIT 1",
            (campaign_id,),
        ).fetchone()
        actions = dict(conn.execute(
            "SELECT action, COUNT(*) FROM decisions WHERE at >= ? AND campaign_id = ? GROUP BY action",
            (now - since, campaign_id),
        ).fetchall())
        all_actions = dict(conn.execute(
            "SELECT action, COUNT(*) FROM decisions WHERE at >= ? GROUP BY action", (now - since,)
        ).fetchall())
    snapshot = dataclasses.asdict(snap)
    snapshot.update(answer_rate=_round(snap.answer_rate, 4), provider_error_rate=round(snap.provider_error_rate, 4))
    latest_dict = decision_row(latest) if latest else None
    capacity = snap.available_agents + snap.wrap_up_ending_soon
    return {
        "now": now,
        "since": since,
        "campaigns": camps,
        "selected": selected,
        "settings": {"pacing": dataclasses.asdict(c.settings.pacing), "safety": dataclasses.asdict(c.settings.safety)},
        "snapshot": snapshot,
        "latest": latest_dict,
        "status": _campaign_safety_status(selected, latest),
        "overview": {
            "capacity": capacity,
            "available_agents": snap.available_agents,
            "active_calls": snap.active_calls,
            "in_flight": snap.bound_in_flight + snap.unbound_in_flight + snap.screening_in_flight,
            "queued_ready": snap.queued_ready,
            "suggested": latest_dict["requested"] if latest_dict else 0,
            "permitted": latest_dict["approved"] if latest_dict else 0,
        },
        "thresholds": _thresholds(c, snap),
        "sensitivity": _sensitivity(c, snap),
        "actions": actions,
        "all_actions": all_actions,
    }


def _campaign_safety_status(campaign: dict, latest) -> str:
    if campaign["status"] != "RUNNING":
        return "idle"
    return safety_status([latest] if latest else [])


def _thresholds(c, snap) -> list[dict]:
    lim = c.settings.safety

    def row(key, label, current, limit, unit, explanation):
        if limit is None:
            status = "off"
        elif current is None:
            status = "no_data"
        else:
            ratio = current / limit if limit else (math.inf if current else 0)
            status = "over" if ratio > 1 else "near" if ratio >= 0.8 else "ok"
        return {"key": key, "label": label, "current": current, "limit": limit, "unit": unit,
                "status": status, "explanation": explanation}

    abandon = snap.recent_abandoned / snap.recent_answered if snap.recent_answered >= lim.abandon_min_samples else None
    predictive = snap.mode == Mode.PREDICTIVE

    def per_free_agent(in_flight):
        if snap.available_agents:
            return round(in_flight / snap.available_agents, 2)
        return math.inf if in_flight else None

    # screening campaigns are capped on bot calls (plus people on hold) per free agent,
    # plain predictive ones on unbound calls per free agent; progressive uses neither
    if snap.screening:
        overdial = row("max_screening_ratio", "Bot calls in flight per free agent",
                       per_free_agent(snap.screening_in_flight + snap.pending_transfers), lim.max_screening_ratio,
                       "ratio", "Predictive screening: bot calls plus borrowers on hold, per free agent. "
                                "Progressive screening keeps this at 1 or below.")
    else:
        overdial = row("max_overdial_ratio", "Predictive calls in flight per free agent",
                       per_free_agent(snap.unbound_in_flight), lim.max_overdial_ratio, "ratio",
                       "Backstop on predictive over-dialing, recomputed from the database every decision.")
    if not predictive:
        overdial["status"] = "not_applicable"
    rows = [
        row("max_active_calls", "Live calls (campaign)", snap.active_calls, lim.max_active_calls, "calls",
            "Hard ceiling on live calls for the campaign; new calls stop at the limit."),
        row("max_abandon_rate", "Abandoned / answered", _round(abandon, 4), lim.max_abandon_rate, "ratio",
            f"Over the last {lim.abandon_window} answered calls (needs {lim.abandon_min_samples}). "
            "Above the limit predictive is forced back to progressive."),
        row("max_calls_per_campaign", "Calls started (campaign)", snap.calls_started, lim.max_calls_per_campaign,
            "calls", "Optional cap on how many calls one campaign may start."),
        overdial,
        row("provider_max_error_rate", f"Provider error rate (last {lim.provider_window_s:.0f}s)",
            round(snap.provider_error_rate, 4) if snap.provider_requests >= lim.provider_min_requests else None,
            lim.provider_max_error_rate, "ratio",
            f"Needs {lim.provider_min_requests} requests in the window. Above the limit no new calls start "
            "on this provider; live calls carry on."),
    ]
    if snap.screening:
        fail = (snap.recent_transfer_failures / snap.recent_willing
                if snap.recent_willing >= lim.abandon_min_samples else None)
        rows.append(row("max_transfer_fail_rate", "Willing borrowers not reached", _round(fail, 4),
                        lim.max_transfer_fail_rate, "ratio",
                        "Willing borrowers who never got an agent. Above the limit predictive screening "
                        "falls back to progressive."))
        rows.append(row("max_bot_calls", "Bot conversations in flight", snap.screening_in_flight, lim.max_bot_calls,
                        "calls", "How many conversations the screening bot platform can hold at once."))
    for r in rows:
        if r["current"] == math.inf:
            r["current"] = None
            if r["status"] != "not_applicable":
                r["status"] = "over"
    return rows


def _sensitivity(c, snap) -> list[dict]:
    """What the predictive pacer would ask for, and what safety would allow, at a few
    answer rates if every online (not paused) agent were free and nothing was ringing.
    Uses the real pacer and safety controller on a copy of the live snapshot, so it
    follows the current settings; it's a planning view, not a forecast."""
    pacer = PredictivePacer(c.settings.pacing)
    safety = SafetyController(c.settings.safety)
    window = c.settings.pacing.answer_window
    with c.db.read() as conn:
        agents = conn.execute(
            "SELECT COUNT(*) FROM agents WHERE state NOT IN ('OFFLINE', 'PAUSED')"
        ).fetchone()[0]
    out = []
    for rate in (0.2, 0.5, 0.7):
        trial = dataclasses.replace(
            snap, mode=Mode.PREDICTIVE, campaign_status="RUNNING", screening=False,
            available_agents=agents, wrap_up_ending_soon=0, unbound_in_flight=0, bound_in_flight=0,
            active_calls=0, provider_requests=0, provider_errors=0,
            ring_total=window, ring_answered=round(rate * window),
            short_total=min(window, c.settings.safety.answer_rate_short_window),
            short_answered=round(rate * min(window, c.settings.safety.answer_rate_short_window)),
            queued_ready=10_000, recent_answered=0, recent_abandoned=0,
        )
        request = pacer.decide(trial)
        decision = safety.review(request, trial)
        out.append({
            "answer_rate": rate,
            "agents": agents,
            "capacity": request.inputs.get("capacity"),
            "in_flight": request.inputs.get("unbound_in_flight"),
            "suggested": request.requested,
            "permitted": decision.approved,
            "expected_value": request.inputs.get("expected_value_n"),
            "action": decision.action.value,
            "reasons": list(decision.reasons),
        })
    return out


def decision_row(r) -> dict:
    return {
        "id": r["id"], "code": f"DEC-{r['id']}", "campaign_id": r["campaign_id"],
        "campaign": r["campaign_name"], "at": r["at"], "mode": r["mode"], "requested": r["requested"],
        "approved": r["approved"], "action": r["action"], "bound": bool(r["bound"]), "started": r["started"],
        "reasoning": r["reasoning"],
        "reasons": json.loads(r["safety_reasons"]) if r["safety_reasons"] else [],
        "inputs": json.loads(r["inputs"]) if r["inputs"] else {},
    }


def decisions(c, campaign_id=None, action=None, since: float = 3600, changes_only: bool = False,
              limit: int = 100) -> dict:
    now = c.clock.now()
    where, args = ["d.at >= ?"], [now - since]
    if campaign_id:
        where.append("d.campaign_id = ?")
        args.append(campaign_id)
    if action:
        where.append("d.action = ?")
        args.append(action)
    if changes_only:
        where.append("(d.prev IS NULL OR d.prev != d.action)")
    with c.db.read() as conn:
        rows = [decision_row(r) for r in conn.execute(
            _CHANGES + " SELECT d.*, k.name AS campaign_name FROM d JOIN campaigns k ON k.id = d.campaign_id"
            f" WHERE {' AND '.join(where)} ORDER BY d.id DESC LIMIT ?",
            [now - since - _LOOKBACK, *args, limit],
        )]
        cf, ca = _camp("campaign_id", campaign_id)
        counts = dict(conn.execute(
            f"SELECT action, COUNT(*) FROM decisions WHERE at >= ?{cf} GROUP BY action", [now - since, *ca]
        ).fetchall())
    return {"now": now, "decisions": rows, "counts": counts, "total": sum(counts.values())}


def decision(c, decision_id: int) -> dict:
    with c.db.read() as conn:
        row = conn.execute(
            "SELECT d.*, k.name AS campaign_name FROM decisions d JOIN campaigns k ON k.id = d.campaign_id"
            " WHERE d.id = ?",
            (decision_id,),
        ).fetchone()
    if row is None:
        raise KeyError(f"decision {decision_id} not found")
    return {"now": c.clock.now(), "decision": decision_row(row)}


# ---- providers ----------------------------------------------------------------


def providers(c, since: float) -> dict:
    from .console import PROVIDER_INFO
    now = c.clock.now()
    start = now - since
    with c.db.read() as conn:
        requests = {}
        for r in conn.execute(
            "SELECT provider, COALESCE(result, 'pending') AS result, COUNT(*) AS n FROM provider_requests"
            " WHERE sent_at >= ? GROUP BY provider, result",
            (start,),
        ):
            requests.setdefault(r["provider"], {})[r["result"]] = r["n"]
        events = {}
        duplicates = {}
        for r in conn.execute(
            f"SELECT provider, CASE WHEN {_redundant()} THEN 'confirmation' ELSE COALESCE(outcome, 'pending') END"
            " AS outcome, COUNT(*) AS n, SUM(deliveries - 1) AS dup FROM provider_events WHERE received_at >= ?"
            " GROUP BY 1, 2",
            (start,),
        ):
            events.setdefault(r["provider"], {})[r["outcome"]] = r["n"]
            duplicates[r["provider"]] = duplicates.get(r["provider"], 0) + (r["dup"] or 0)
        timing = {r["provider"]: r for r in conn.execute(
            "SELECT c.provider, AVG(e.occurred_at - c.sending_at) AS ring_s FROM provider_events e"
            " JOIN calls c ON c.id = e.call_id WHERE e.event_type = 'RINGING' AND e.received_at >= ?"
            " AND c.sending_at IS NOT NULL GROUP BY c.provider",
            (start,),
        )}
        answer = {r["provider"]: r["s"] for r in conn.execute(
            "SELECT provider, AVG(answered_at - sending_at) AS s FROM calls WHERE answered_at >= ?"
            " AND sending_at IS NOT NULL GROUP BY provider",
            (start,),
        )}
        delivery = {r["provider"]: r["s"] for r in conn.execute(
            "SELECT provider, AVG(received_at - occurred_at) AS s FROM provider_events WHERE received_at >= ?"
            " AND occurred_at IS NOT NULL AND event_id NOT LIKE 'reconcile:%' GROUP BY provider",
            (start,),
        )}
        live_calls = dict(conn.execute(
            f"SELECT provider, COUNT(*) FROM calls WHERE state IN {_IN_LIVE} AND provider IS NOT NULL GROUP BY provider"
        ).fetchall())
        used_by = {}
        for r in conn.execute("SELECT id, name, provider, status FROM campaigns ORDER BY id"):
            used_by.setdefault(r["provider"], []).append({"id": r["id"], "name": r["name"], "status": r["status"]})
        errors = _provider_error_rates(c, conn, now)
        series = _provider_series(conn, now, start)
    items = []
    for name, provider in c.providers.items():
        req = requests.get(name, {})
        total = sum(req.values())
        prof = provider.profile
        items.append({
            "name": name, **PROVIDER_INFO.get(name, {}),
            "status": _provider_status(c, name, errors[name]["rate"]),
            "outage": provider.outage,
            "fault": c.faults.get(name),
            "requests": {"total": total, "accepted": req.get("accepted", 0), "rejected": req.get("rejected", 0),
                         "timeout": req.get("timeout", 0), "pending": req.get("pending", 0)},
            "success_rate": round(req.get("accepted", 0) / total, 4) if total else None,
            "error_rate_60s": errors[name]["rate"],
            "events": events.get(name, {}),
            "duplicates": duplicates.get(name, 0),
            "out_of_order": events.get(name, {}).get("stale", 0) + events.get(name, {}).get("late", 0),
            "avg_ring_s": _round(timing[name]["ring_s"], 2) if name in timing else None,
            "avg_answer_s": _round(answer.get(name), 2),
            "avg_delivery_delay_s": _round(delivery.get(name), 2),
            "live_calls": live_calls.get(name, 0),
            "campaigns": used_by.get(name, []),
            "profile": {
                "ring_s": list(prof.ring_s), "answer_after_s": list(prof.answer_after_s),
                "reject_rate": prof.reject_rate, "timeout_rate": prof.timeout_rate, "drop_rate": prof.drop_rate,
                "busy_rate": prof.busy_rate, "duplicate_rate": prof.duplicate_rate, "jitter_s": prof.jitter_s,
            },
        })
    return {"now": now, "since": since, "providers": items, "series": series}


def _provider_series(conn, now: float, start: float) -> dict:
    first = conn.execute("SELECT MIN(sent_at) FROM provider_requests WHERE sent_at >= ?", (start,)).fetchone()[0]
    origin_raw = max(start, first) if first is not None else max(start, now - 600)
    size = _bucket(now - origin_raw)
    origin = math.floor(origin_raw / size) * size
    n = int((now - origin) // size) + 1
    points = [{"t": origin + i * size, "accepted": 0, "timeout": 0, "rejected": 0, "A": 0, "B": 0}
              for i in range(n)]
    for r in conn.execute(
        "SELECT CAST((sent_at - ?) / ? AS INTEGER) AS b, provider, COALESCE(result, 'pending') AS result,"
        " COUNT(*) AS n FROM provider_requests WHERE sent_at >= ? GROUP BY b, provider, result",
        (origin, size, origin),
    ):
        if 0 <= r["b"] < n:
            p = points[r["b"]]
            if r["result"] in p:
                p[r["result"]] += r["n"]
            p[r["provider"]] = p.get(r["provider"], 0) + r["n"]
            key = f"{r['provider']}_{r['result']}"
            p[key] = p.get(key, 0) + r["n"]
    return {"bucket_s": size, "points": points}


def provider(c, name: str, since: float) -> dict:
    if name not in c.providers:
        raise KeyError(f"provider {name} not found")
    data = providers(c, since)
    match = next(p for p in data["providers"] if p["name"] == name)
    with c.db.read() as conn:
        recent = [_event_row(r) for r in conn.execute(
            "SELECT e.*, c.campaign_id, k.name AS campaign_name FROM provider_events e"
            " LEFT JOIN calls c ON c.id = e.call_id LEFT JOIN campaigns k ON k.id = c.campaign_id"
            " WHERE e.provider = ? ORDER BY e.received_at DESC, e.rowid DESC LIMIT 25",
            (name,),
        )]
        requests = [dict(r) | {"call": call_code(r["call_id"])} for r in conn.execute(
            "SELECT id, call_id, sent_at, result, error FROM provider_requests WHERE provider = ?"
            " ORDER BY id DESC LIMIT 25",
            (name,),
        )]
        faults = [dict(r) for r in conn.execute(
            "SELECT at, action, detail FROM audit_log WHERE subject = ? ORDER BY id DESC LIMIT 10",
            (f"provider:{name}",),
        )]
    return {"now": data["now"], "provider": match, "events": recent, "requests": requests, "faults": faults}


# ---- events and recovery ------------------------------------------------------

EVENT_STATUS = {
    "applied": ("processed", "info"),
    "stale": ("ignored_stale", "warning"),
    "late": ("ignored_late", "warning"),
    "invalid": ("rejected_invalid", "error"),
    "orphan": ("orphan", "error"),
    "missing": ("orphan", "error"),
    None: ("pending", "warning"),
}


def _event_row(r) -> dict:
    status, severity = EVENT_STATUS.get(r["outcome"], ("processed", "info"))
    if r["outcome"] == "stale" and r["note"] == f"{r['event_type']} while {r['event_type']}":
        status, severity = "confirmation", "info"
    keys = r.keys()
    return {
        "event_id": r["event_id"], "type": r["event_type"], "provider": r["provider"],
        "provider_call_id": r["provider_call_id"], "call_id": r["call_id"], "call": call_code(r["call_id"]),
        "campaign_id": r["campaign_id"] if "campaign_id" in keys else None,
        "campaign": r["campaign_name"] if "campaign_name" in keys else None,
        "occurred_at": r["occurred_at"], "received_at": r["received_at"], "processed_at": r["processed_at"],
        "outcome": r["outcome"], "note": r["note"], "reason": r["reason"], "talk_seconds": _round(r["talk_seconds"]),
        "deliveries": r["deliveries"], "duplicate": r["deliveries"] > 1,
        "reconciled": r["event_id"].startswith("reconcile:"),
        "status": status, "severity": severity,
    }


def events(c, type_=None, provider=None, campaign_id=None, status=None, q=None, since: float = 3600,
           limit: int = 100) -> dict:
    now = c.clock.now()
    where, args = ["e.received_at >= ?"], [now - since]
    if type_:
        where.append("e.event_type = ?")
        args.append(type_)
    if provider:
        where.append("e.provider = ?")
        args.append(provider)
    if campaign_id:
        where.append("c.campaign_id = ?")
        args.append(campaign_id)
    if status == "duplicate":
        where.append("e.deliveries > 1")
    elif status == "reconciled":
        where.append("e.event_id LIKE 'reconcile:%'")
    elif status == "pending":
        where.append("e.processed_at IS NULL")
    elif status == "confirmation":
        where.append(_redundant("e"))
    elif status == "ignored_stale":
        where.append(f"e.outcome = 'stale' AND NOT {_redundant('e')}")
    elif status:
        outcomes = [k for k, v in EVENT_STATUS.items() if k and v[0] == status]
        if not outcomes:
            raise ValueError(f"unknown event status {status!r}")
        where.append(f"e.outcome IN ({', '.join('?' * len(outcomes))})")
        args += outcomes
    if q:
        term = q.strip().upper().removeprefix("CALL-")
        if term.isdigit():
            where.append("(e.call_id = ? OR e.call_id = ?)")
            args += [int(term), int(term) - 10000]
        else:
            where.append("e.event_id LIKE ?")
            args.append(f"%{q.strip()}%")
    base = (" FROM provider_events e LEFT JOIN calls c ON c.id = e.call_id"
            " LEFT JOIN campaigns k ON k.id = c.campaign_id")
    with c.db.read() as conn:
        rows = [_event_row(r) for r in conn.execute(
            f"SELECT e.*, c.campaign_id, k.name AS campaign_name{base} WHERE {' AND '.join(where)}"
            " ORDER BY e.received_at DESC, e.rowid DESC LIMIT ?",
            [*args, limit],
        )]
        matched = conn.execute(f"SELECT COUNT(*){base} WHERE {' AND '.join(where)}", args).fetchone()[0]
        totals = conn.execute(
            "SELECT COUNT(*) AS total, COALESCE(SUM(deliveries - 1), 0) AS duplicates,"
            " COALESCE(SUM(outcome = 'applied'), 0) AS applied,"
            f" COALESCE(SUM(outcome IN ('stale', 'late') AND NOT {_redundant()}), 0) AS out_of_order,"
            f" COALESCE(SUM({_redundant()}), 0) AS confirmations,"
            " COALESCE(SUM(outcome IN ('invalid', 'orphan', 'missing')), 0) AS rejected,"
            " COALESCE(SUM(processed_at IS NULL), 0) AS pending,"
            " COALESCE(SUM(event_id LIKE 'reconcile:%'), 0) AS reconciled,"
            " COALESCE(SUM(event_type IN ('FAILED', 'TIMED_OUT')), 0) AS failures"
            " FROM provider_events WHERE received_at >= ?",
            (now - since,),
        ).fetchone()
        requests = dict(conn.execute(
            "SELECT COALESCE(result, 'pending'), COUNT(*) FROM provider_requests WHERE sent_at >= ? GROUP BY 1",
            (now - since,),
        ).fetchall())
        types = [r[0] for r in conn.execute("SELECT DISTINCT event_type FROM provider_events ORDER BY 1")]
        camps = [dict(r) for r in conn.execute("SELECT id, name FROM campaigns ORDER BY id")]
    return {"now": now, "since": since, "events": rows, "matched": matched, "totals": dict(totals),
            "requests": requests, "types": types, "campaigns": camps}


def event(c, event_id: str) -> dict:
    with c.db.read() as conn:
        row = conn.execute(
            "SELECT e.*, c.campaign_id, k.name AS campaign_name FROM provider_events e"
            " LEFT JOIN calls c ON c.id = e.call_id LEFT JOIN campaigns k ON k.id = c.campaign_id"
            " WHERE e.event_id = ?",
            (event_id,),
        ).fetchone()
        if row is None:
            raise KeyError(f"event {event_id} not found")
        related = [_event_row(r) for r in conn.execute(
            "SELECT e.*, NULL AS campaign_id, NULL AS campaign_name FROM provider_events e"
            " WHERE e.provider_call_id = ? AND e.event_id != ? ORDER BY e.received_at, e.rowid",
            (row["provider_call_id"], event_id),
        )] if row["provider_call_id"] else []
        call_state = None
        if row["call_id"]:
            r = conn.execute("SELECT state, end_reason FROM calls WHERE id = ?", (row["call_id"],)).fetchone()
            call_state = dict(r) if r else None
    return {"now": c.clock.now(), "event": _event_row(row), "related": related, "call": call_state}


def _recovery_row(r) -> dict:
    return {
        "id": r["id"], "code": f"REC-{r['id']}", "at": r["at"], "action": r["action"], "detail": r["detail"],
        "call_id": r["call_id"], "call": call_code(r["call_id"]),
        "agent_id": r["agent_id"], "agent_code": agent_code(r["agent_id"]),
        "campaign_id": r["campaign_id"], "campaign": r["campaign"],
    }


def recovery(c, since: float = 3600, limit: int = 50) -> dict:
    now = c.clock.now()
    t = c.settings.timeouts
    with c.db.read() as conn:
        rows = [_recovery_row(r) for r in conn.execute(
            "SELECT r.*, c.campaign_id, k.name AS campaign FROM recovery_log r"
            " LEFT JOIN calls c ON c.id = r.call_id LEFT JOIN campaigns k ON k.id = c.campaign_id"
            " WHERE r.at >= ? ORDER BY r.id DESC LIMIT ?",
            (now - since, limit),
        )]
        actions = dict(conn.execute(
            "SELECT action, COUNT(*) FROM recovery_log WHERE at >= ? GROUP BY action", (now - since,)
        ).fetchall())
        pending = {
            "ambiguous_requests": conn.execute(
                "SELECT COUNT(*) FROM calls WHERE state = 'RESERVED' AND initiation IN ('SENDING', 'UNKNOWN')"
            ).fetchone()[0],
            "unknown_transfers": conn.execute(
                "SELECT COUNT(*) FROM calls WHERE state = 'TRANSFER_PENDING' AND transfer_status IN ('SENDING', 'UNKNOWN')"
                " AND transfer_lease_expires_at < ?", (now,)
            ).fetchone()[0],
            "expired_reservations": conn.execute(
                "SELECT COUNT(*) FROM calls WHERE state = 'RESERVED' AND lease_expires_at < ?", (now,)
            ).fetchone()[0],
            "quiet_calls": conn.execute(
                f"SELECT COUNT(*) FROM calls WHERE state IN {_IN_LIVE} AND state != 'RESERVED'"
                " AND last_event_at < ?", (now - t.stuck_call_s,)
            ).fetchone()[0],
        }
        workers = [dict(r) for r in conn.execute("SELECT * FROM workers ORDER BY id")]
    return {"now": now, "since": since, "recovery": rows, "actions": actions, "total": sum(actions.values()),
            "pending": pending, "workers": workers,
            "timeouts": {"lease_s": t.lease_s, "stuck_call_s": t.stuck_call_s,
                         "ambiguous_give_up_s": t.ambiguous_give_up_s, "provider_request_s": t.provider_request_s}}


def recovery_item(c, recovery_id: int) -> dict:
    with c.db.read() as conn:
        row = conn.execute(
            "SELECT r.*, c.campaign_id, k.name AS campaign FROM recovery_log r"
            " LEFT JOIN calls c ON c.id = r.call_id LEFT JOIN campaigns k ON k.id = c.campaign_id WHERE r.id = ?",
            (recovery_id,),
        ).fetchone()
    if row is None:
        raise KeyError(f"recovery action {recovery_id} not found")
    out = {"now": c.clock.now(), "recovery": _recovery_row(row), "call": None}
    if row["call_id"]:
        out["call"] = call(c, row["call_id"])
    return out


# ---- settings -----------------------------------------------------------------


def settings(c) -> dict:
    from .config import Settings
    from .console import AUDIENCES, FAULTS
    return {
        "now": c.clock.now(),
        "settings": dataclasses.asdict(c.settings),
        "defaults": dataclasses.asdict(Settings()),
        "audiences": AUDIENCES,
        "faults": FAULTS,
        "console": {"db_path": c.path, "history_s": c.history_s, "tick_s": c.tick_s, "seed": c.seed},
    }
