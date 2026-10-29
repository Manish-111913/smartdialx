"""CLI entry point.

    python -m smartdialx.main simulate --mode predictive --answer-rate 0.5
    python -m smartdialx.main simulate --scenario outage --mode predictive --timeline
    python -m smartdialx.main simulate --mode progressive --screening
    python -m smartdialx.main scenarios
    python -m smartdialx.main compare-screening
    python -m smartdialx.main demo
    python -m smartdialx.main serve       # live console + HTTP API for the frontend
"""

import argparse
import logging
import os
import sys

from . import demos
from .simulator import POPULATION, PRESETS, Scenario, SimReport, preset, run


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="smartdialx", description="SmartDialX dialer prototype (mock providers only)")
    parser.add_argument("-v", "--verbose", action="store_true", help="debug logging")
    sub = parser.add_subparsers(dest="command", required=True)

    sim = sub.add_parser("simulate", help="run one simulated campaign")
    sim.add_argument("--scenario", choices=list(PRESETS), help="start from a preset scenario")
    sim.add_argument("--mode", choices=["progressive", "predictive"], default="progressive")
    sim.add_argument("--provider", choices=["A", "B"])
    sim.add_argument("--agents", type=int)
    sim.add_argument("--calls", type=int, dest="borrowers", help="number of borrowers to call")
    sim.add_argument("--duration", type=int, dest="duration_s", help="simulated seconds")
    sim.add_argument("--answer-rate", type=float)
    sim.add_argument("--talk-time", type=float, dest="talk_s", help="average talk time in seconds")
    sim.add_argument("--seed", type=int)
    sim.add_argument("--screening", action="store_true", default=None,
                     help="mock screening bot calls first; only willing borrowers are transferred to an agent")
    sim.add_argument("--willing-rate", type=float, help="share of people who answer and agree to talk to an agent")
    sim.add_argument("--hold", type=float, dest="hold_s", help="seconds a willing borrower waits for an agent")
    sim.add_argument("--timeline", action="store_true", help="print a per-minute timeline")
    sim.add_argument("--json", action="store_true", help="print the full report as JSON")

    sc = sub.add_parser("scenarios", help="run every preset in both modes and compare")
    sc.add_argument("--only", nargs="*", choices=list(PRESETS), help="subset of presets")
    sc.add_argument("--seed", type=int, default=7)

    cs = sub.add_parser("compare-screening",
                        help="same borrowers with and without the screening bot, both pacing modes")
    cs.add_argument("--answer-rate", type=float, nargs="*", default=[0.2, 0.5])
    cs.add_argument("--seed", type=int, default=7)

    sub.add_parser("demo", help="walk through the failure cases step by step")

    sv = sub.add_parser("serve", help="run the live console and the HTTP API used by the frontend")
    sv.add_argument("--host", default="127.0.0.1")
    sv.add_argument("--port", type=int, default=8000)
    sv.add_argument("--db", default=os.path.join("data", "console.db"), help="SQLite file for the console")
    sv.add_argument("--keep", action="store_true", help="resume the existing database instead of starting fresh")
    sv.add_argument("--history", type=float, default=1200, help="seconds of activity to replay on a fresh start")
    sv.add_argument("--seed", type=int, default=7)

    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.WARNING, format="%(levelname)s %(name)s %(message)s")

    if args.command == "simulate":
        return _simulate(args)
    if args.command == "scenarios":
        return _scenarios(args)
    if args.command == "compare-screening":
        return _compare_screening(args)
    if args.command == "demo":
        demos.run_all()
        return 0
    if args.command == "serve":
        return _serve(args)
    return 1


def _serve(args) -> int:
    from .api import serve
    from .console import Console

    os.makedirs(os.path.dirname(os.path.abspath(args.db)), exist_ok=True)
    serve(Console(args.db, history_s=args.history, seed=args.seed, keep=args.keep), args.host, args.port)
    return 0


def _simulate(args) -> int:
    overrides = {
        "mode": args.mode,
        "provider": args.provider,
        "agents": args.agents,
        "borrowers": args.borrowers,
        "duration_s": args.duration_s,
        "answer_rate": args.answer_rate,
        "talk_s": args.talk_s,
        "seed": args.seed,
        "screening": args.screening,
        "willing_rate": args.willing_rate,
        "hold_s": args.hold_s,
    }
    if args.screening and args.willing_rate is None and args.scenario is None:
        overrides.update(POPULATION)
    if args.scenario:
        scenario = preset(args.scenario, **overrides)
    else:
        scenario = Scenario(**{k: v for k, v in overrides.items() if v is not None})
    report = run(scenario)
    if args.json:
        print(report.to_json())
    else:
        print(format_report(report, timeline=args.timeline))
    return 1 if report.invariant_violations else 0


def _scenarios(args) -> int:
    names = args.only or list(PRESETS)
    rows = []
    for name in names:
        for mode in ("progressive", "predictive"):
            r = run(preset(name, mode=mode, seed=args.seed))
            m = r.metrics
            rows.append([
                name, mode, f"{r.utilization:.1%}", m["calls_initiated"], m["calls_connected"],
                m["calls_abandoned"], f"{m['abandon_rate']:.2%}",
                m["decisions"].get("FORCE_PROGRESSIVE", 0), m["decisions"].get("REDUCE", 0),
                m["decisions"].get("REJECT", 0), len(r.invariant_violations),
            ])
    header = ["scenario", "mode", "util", "initiated", "connected", "abandoned", "abandon%",
              "forced_prog", "reduced", "rejected", "violations"]
    print(_table(header, rows))
    return 0


def _compare_screening(args) -> int:
    rows = []
    for rate in args.answer_rate:
        for screening in (False, True):
            for mode in ("progressive", "predictive"):
                r = run(Scenario(name="compare", mode=mode, screening=screening, answer_rate=rate,
                                 talk_s=120, seed=args.seed, **POPULATION))
                m = r.metrics
                sc = m["screening"] or {}
                rows.append([
                    f"{rate:.0%}", mode, "yes" if screening else "no", m["calls_initiated"],
                    m["agent_conversations"], m["productive_conversations"],
                    f"{r.utilization:.1%}", f"{r.productive_utilization:.1%}",
                    m["calls_abandoned"], sc.get("no_agent", 0) + sc.get("caller_left_hold", 0),
                    len(r.invariant_violations),
                ])
    header = ["answer", "mode", "screening", "initiated", "agent_convs", "productive",
              "util", "productive_util", "abandoned", "willing_not_served", "violations"]
    print(_table(header, rows))
    print("\nproductive = agent conversations with someone who wanted to talk. Without screening, people who")
    print("don't want to talk still reach an agent for a short call; with screening the bot handles them.")
    return 0


def format_report(r: SimReport, timeline: bool = False) -> str:
    s, m = r.scenario, r.metrics
    lines = [
        f"scenario {s.name}: mode={s.mode} provider={s.provider} agents={s.agents} "
        f"duration={s.duration_s}s answer_rate={s.answer_rate:.0%} talk={s.talk_s:.0f}s seed={s.seed}",
        "",
        f"  agent utilization (talking / staffed)  {r.utilization:.1%}",
        f"  productive utilization                 {r.productive_utilization:.1%}",
        f"  occupancy (talking + wrap-up)          {r.occupancy:.1%}",
        f"  calls initiated                        {m['calls_initiated']}",
        f"  answered / connected                   {m['calls_answered']} / {m['calls_connected']}",
        f"  completed / failed / cancelled         {m['calls_completed']} / {m['calls_failed']} / {m['calls_cancelled']}",
        f"  abandoned                              {m['calls_abandoned']} ({m['abandon_rate']:.2%} of answered)",
        f"  observed answer rate                   {m['answer_rate']}",
        f"  queued / live at end                   {m['calls_queued']} / {m['calls_live']}",
        f"  provider requests                      {_kv(m['provider_requests'])}",
        f"  end reasons                            {_kv(m['end_reasons'])}",
        f"  events                                 {_kv(m['events'])}, duplicate deliveries {m['duplicate_deliveries']}",
        f"  safety decisions                       {_kv(m['decisions'])}",
        f"  safety reasons                         {_kv(m['safety_reasons']) or 'none'}",
        f"  recovery actions                       {_kv(m['recovery']) or 'none'}",
        f"  invariant violations                   {len(r.invariant_violations)}",
    ]
    sc = m.get("screening")
    if sc:
        lines[0] += " screening=on (mock bot)"
        lines += [
            "",
            "  screening",
            f"    bot calls attempted / answered       {sc['attempted']} / {sc['answered']}",
            f"    willing / unavailable / declined     {sc['willing']} / {sc['unavailable']} / {sc['declined']}",
            f"    no answer / busy                     {sc['no_answer']} / {sc['busy']}",
            f"    screening failed / provider failures {sc['screen_failed']} / {sc['provider_failures']}",
            f"    transfer attempts                    {sc['transfer_attempts']}",
            f"    connected to an agent                {sc['agent_connections']} (avg hold {sc['avg_hold_s']}s)",
            f"    willing but no agent in time         {sc['no_agent']}",
            f"    hung up while on hold                {sc['caller_left_hold']}",
            f"    transfers blocked by safety          {sc['transfer_blocked']}",
        ]
    if r.drop_reaction:
        d = r.drop_reaction
        lines.append(
            f"  agent drop at {d['at_s']:.0f}s                       staffed now {d['staffed_after']}, "
            f"next decision: {d['action']} {d['approved']}/{d['requested']} with {d['available']} free"
        )
    for v in r.invariant_violations[:10]:
        lines.append(f"    ! {v}")
    if timeline and r.timeline:
        cols = ["t", "staffed", "available", "talking", "wrap_up", "requested", "approved", "action",
                "p_hat", "p_safe", "answer_rate_now", "outage"]
        if s.screening:
            cols.append("on_hold")
        lines += ["", _table(cols, [[row.get(c) for c in cols] for row in r.timeline])]
    return "\n".join(lines)


def _kv(d: dict) -> str:
    return ", ".join(f"{k} {v}" for k, v in d.items())


def _table(header: list, rows: list[list]) -> str:
    cells = [[str(h) for h in header]] + [["" if c is None else str(c) for c in row] for row in rows]
    widths = [max(len(r[i]) for r in cells) for i in range(len(header))]
    out = []
    for i, row in enumerate(cells):
        out.append("  ".join(c.rjust(w) for c, w in zip(row, widths)))
        if i == 0:
            out.append("  ".join("-" * w for w in widths))
    return "\n".join(out)


if __name__ == "__main__":
    sys.exit(main())
