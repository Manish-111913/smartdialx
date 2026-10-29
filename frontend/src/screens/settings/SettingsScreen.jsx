"use client";

import { useMemo, useState } from "react";
import { post, put, useApi } from "@/lib/api";
import { ago, dateTime, duration, num, pct } from "@/lib/format";
import { Badge, Button, ConfirmDialog, ErrorNote, Icon, Skeleton, useAction } from "@/components/ui";
import { display, fromInput, getValue, GROUPS, toInput } from "./fields";

export default function SettingsScreen() {
  const { data, error, loading, refresh } = useApi("/settings", { interval: 15000 });
  const { data: health } = useApi("/health", { interval: 5000 });
  const { run, busy } = useAction();
  const [edits, setEdits] = useState({});
  const [section, setSection] = useState(GROUPS[0].id);
  const [confirm, setConfirm] = useState(null);

  const settings = data?.settings;
  const defaults = data?.defaults;

  // what would be sent: only edits that parse and differ from the saved value
  const pending = useMemo(() => {
    const out = {};
    const errors = {};
    if (!settings) return { patch: out, errors, count: 0 };
    let count = 0;
    for (const group of GROUPS) {
      for (const field of group.fields) {
        if (!(field.path in edits)) continue;
        const parsed = fromInput(field, edits[field.path]);
        if (parsed.error) {
          errors[field.path] = parsed.error;
          continue;
        }
        if (parsed.value === getValue(settings, field.path)) continue;
        const [sec, key] = field.path.split(".");
        out[sec] = { ...out[sec], [key]: parsed.value };
        count += 1;
      }
    }
    return { patch: out, errors, count };
  }, [edits, settings]);

  const invalid = Object.keys(pending.errors).length;

  const save = async () => {
    const ok = await run(() => put("/settings", pending.patch), "Settings saved", "The next pacing decision uses the new values.");
    if (ok) {
      setEdits({});
      refresh();
    }
  };

  const resetSettings = async () => {
    const ok = await run(() => post("/settings/reset"), "Settings back to defaults");
    setConfirm(null);
    if (ok) {
      setEdits({});
      refresh();
    }
  };

  const resetConsole = async () => {
    const ok = await run(() => post("/system/reset"), "Demo data reset", "A fresh world was seeded and is replaying its history.");
    setConfirm(null);
    if (ok) refresh();
  };

  const changedIn = (group) =>
    group.fields.filter((f) => {
      if (!settings || !(f.path in edits)) return false;
      const parsed = fromInput(f, edits[f.path]);
      return parsed.error || parsed.value !== getValue(settings, f.path);
    }).length;

  const differsFromDefault = settings && defaults
    ? GROUPS.flatMap((g) => g.fields).filter((f) => getValue(settings, f.path) !== getValue(defaults, f.path)).length
    : 0;

  return (
    <div className="font-sans text-[#172033] antialiased bg-[#F6F8FB] min-h-[calc(100vh-3.5rem)] px-space-xl py-space-xl">
      <div className="max-w-[1320px] mx-auto flex flex-col gap-space-lg">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-lg text-headline-lg text-slate-900 font-bold tracking-tight">Settings</h1>
              <Badge tone="indigo" dot>
                Applies live
              </Badge>
            </div>
            <p className="font-body-sm text-body-sm text-slate-500 mt-1 max-w-2xl">
              The limits the live console runs with: pacing, safety controls, recovery timeouts and screening. Saved changes
              apply from the next pacing decision.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pending.count + invalid > 0 && (
              <Button variant="ghost" icon="undo" onClick={() => setEdits({})} disabled={busy}>
                Discard changes
              </Button>
            )}
            <Button icon="restart_alt" onClick={() => setConfirm("settings")} disabled={busy || !settings}>
              Reset to defaults
            </Button>
            <Button variant="primary" icon="save" onClick={save} disabled={busy || pending.count === 0 || invalid > 0}>
              {pending.count > 0 ? `Save ${pending.count} change${pending.count > 1 ? "s" : ""}` : "Save changes"}
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/70 text-[12.5px] text-amber-800">
          <Icon name="info" className="text-[18px] shrink-0" />
          <p>
            Every value here is a starting assumption for this prototype, not a regulatory or carrier limit. Real limits
            need to come from compliance and be checked against real campaign data. The server checks each change and
            refuses combinations that can&apos;t work (for example a request timeout longer than the lease).
          </p>
        </div>

        <ErrorNote error={error} />

        <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-space-lg items-start">
          <nav className="lg:sticky lg:top-20 bg-white rounded-xl border border-slate-200/80 shadow-sm p-2 flex flex-col gap-0.5">
            {[...GROUPS, { id: "console", title: "Console & data", icon: "dns" }].map((g) => {
              const changed = g.fields ? changedIn(g) : 0;
              const active = section === g.id;
              return (
                <a
                  key={g.id}
                  href={`#${g.id}`}
                  onClick={() => setSection(g.id)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    active ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon name={g.icon} className={`text-[17px] ${active ? "text-indigo-600" : "text-slate-400"}`} />
                    {g.title}
                  </span>
                  {changed > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[10.5px] font-bold flex items-center justify-center">{changed}</span>}
                </a>
              );
            })}
            {settings && (
              <p className="px-3 pt-2 mt-1 border-t border-slate-100 text-[11.5px] text-slate-400">
                {differsFromDefault === 0 ? "All values at their defaults." : `${differsFromDefault} value${differsFromDefault > 1 ? "s" : ""} differ from the defaults.`}
              </p>
            )}
          </nav>

          <div className="flex flex-col gap-space-lg min-w-0">
            {loading && !settings
              ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)
              : GROUPS.map((group) => (
                  <section key={group.id} id={group.id} className="scroll-mt-20 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                    <header className="px-5 py-4 border-b border-slate-100 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                        <Icon name={group.icon} className="text-[19px]" />
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm font-bold text-slate-900">{group.title}</h2>
                        <p className="text-[12.5px] text-slate-500 mt-0.5 max-w-3xl">{group.intro}</p>
                      </div>
                    </header>
                    <div className="divide-y divide-slate-100">
                      {group.fields.map((field) => (
                        <FieldRow
                          key={field.path}
                          field={field}
                          saved={getValue(settings, field.path)}
                          fallback={getValue(defaults, field.path)}
                          edit={edits[field.path]}
                          error={pending.errors[field.path]}
                          onChange={(value) => setEdits((all) => ({ ...all, [field.path]: value }))}
                          onRevert={() =>
                            setEdits((all) => {
                              const next = { ...all };
                              delete next[field.path];
                              return next;
                            })
                          }
                          onDefault={() => setEdits((all) => ({ ...all, [field.path]: toInput(field, getValue(defaults, field.path)) }))}
                        />
                      ))}
                    </div>
                  </section>
                ))}

            <ConsoleSection data={data} health={health} onReset={() => setConfirm("console")} busy={busy} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "settings"}
        title="Reset all settings?"
        message="Every pacing, safety, timeout and screening value goes back to its default. Campaign-specific wait times and no-agent policies are kept."
        confirmLabel="Reset settings"
        busy={busy}
        onConfirm={resetSettings}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "console"}
        title="Reset demo data?"
        message={
          <>
            This deletes the console database (every campaign, agent, call, event, decision and recovery record) and seeds a
            fresh synthetic world, then replays {duration(data?.console?.history_s)} of activity. Settings are kept.
          </>
        }
        confirmLabel="Reset demo data"
        danger
        busy={busy}
        onConfirm={resetConsole}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function FieldRow({ field, saved, fallback, edit, error, onChange, onRevert, onDefault }) {
  const value = edit !== undefined ? edit : toInput(field, saved);
  const parsed = edit !== undefined ? fromInput(field, edit) : null;
  const changed = parsed && !parsed.error && parsed.value !== saved;
  const atDefault = saved === fallback;

  return (
    <div className="px-5 py-3.5 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-3 items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-slate-800">{field.label}</span>
          {changed && <Badge tone="indigo">Unsaved</Badge>}
          {!changed && !atDefault && <Badge tone="amber">Custom</Badge>}
        </div>
        {field.help && <p className="text-[12px] text-slate-500 mt-0.5">{field.help}</p>}
        <p className="text-[11px] text-slate-400 mt-0.5 font-label-mono-xs">
          {field.path} · default {display(field, fallback)}
          {changed && <> · saved {display(field, saved)}</>}
        </p>
      </div>
      <div className="flex items-center gap-2 md:justify-end">
        <FieldInput field={field} value={value} error={error} onChange={onChange} />
        <div className="flex items-center w-14 justify-end">
          {edit !== undefined && (
            <button type="button" title="Undo this change" onClick={onRevert} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100">
              <Icon name="undo" className="text-[16px]" />
            </button>
          )}
          {!atDefault && edit === undefined && (
            <button type="button" title="Use the default" onClick={onDefault} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100">
              <Icon name="restart_alt" className="text-[16px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldInput({ field, value, error, onChange }) {
  if (field.kind === "bool") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={!!value}
        onClick={() => onChange(!value)}
        className={`relative w-10 h-6 rounded-full transition-colors ${value ? "bg-indigo-600" : "bg-slate-300"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? "left-[18px]" : "left-0.5"}`} />
      </button>
    );
  }
  if (field.kind === "select") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-56 py-0 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-800 focus:border-indigo-400 focus:ring-indigo-100"
      >
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  const unit = field.kind === "percent" ? "%" : field.unit;
  return (
    <div className="flex flex-col items-end">
      <div className={`flex items-center h-9 w-48 rounded-lg border bg-white overflow-hidden focus-within:ring-2 ${error ? "border-rose-300 focus-within:ring-rose-100" : "border-slate-200 focus-within:border-indigo-400 focus-within:ring-indigo-100"}`}>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          step={field.step ?? (field.kind === "int" ? 1 : "any")}
          min={field.min}
          max={field.max}
          placeholder={field.nullable ? "no limit" : undefined}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 h-full border-0 py-0 px-3 text-[13px] text-slate-800 tabular-nums focus:ring-0"
        />
        {unit && <span className="px-2.5 h-full flex items-center bg-slate-50 border-l border-slate-200 text-[11.5px] text-slate-500 whitespace-nowrap">{unit}</span>}
      </div>
      {error && <span className="text-[11px] text-rose-600 mt-1">{error}</span>}
    </div>
  );
}

function ConsoleSection({ data, health, onReset, busy }) {
  const audiences = data?.audiences ?? {};
  const info = data?.console;
  return (
    <section id="console" className="scroll-mt-20 bg-white rounded-xl border border-slate-200/80 shadow-sm">
      <header className="px-5 py-4 border-b border-slate-100 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
          <Icon name="dns" className="text-[19px]" />
        </div>
        <div>
          <h2 className="font-headline-sm text-headline-sm font-bold text-slate-900">Console &amp; data</h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5 max-w-3xl">
            The live console runs the real pipeline against mock providers A and B with synthetic borrowers (+1-555 numbers).
            Nothing here dials a real phone.
          </p>
        </div>
      </header>
      <div className="p-5 grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="flex flex-col gap-3">
          <h3 className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">Engine</h3>
          <dl className="grid grid-cols-2 gap-2 text-[12.5px]">
            <Stat label="Status" value={health ? (health.warming_up ? "Replaying history" : "Running") : "—"} />
            <Stat label="Console clock" value={health ? dateTime(health.now) : "—"} />
            <Stat label="History start" value={health ? `${dateTime(health.history_start)} (${ago(health.history_start, health.now)})` : "—"} />
            <Stat label="Ticks / errors" value={health ? `${num(health.ticks)} / ${num(health.errors)}` : "—"} />
            <Stat label="Running campaigns" value={health ? num(health.running_campaigns) : "—"} />
            <Stat label="Agents online" value={health ? num(health.agents_online) : "—"} />
            <Stat label="Tick length" value={info ? `${info.tick_s}s` : "—"} />
            <Stat label="Random seed" value={info ? String(info.seed) : "—"} />
          </dl>
          <p className="text-[11.5px] text-slate-400 font-label-mono-xs break-all">Database: {info?.db_path ?? "—"}</p>
          <div className="mt-1 p-3 rounded-lg border border-rose-200 bg-rose-50/60 flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-rose-800">Reset demo data</p>
              <p className="text-[12px] text-rose-700/80">Wipe the console database and seed a fresh world. Settings are kept.</p>
            </div>
            <Button variant="danger" icon="delete_sweep" onClick={onReset} disabled={busy || !data}>
              Reset
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">Mock audiences</h3>
          <p className="text-[12px] text-slate-500 -mt-1">
            Who picks up when a campaign calls. Each campaign picks one; outcomes are random draws with these odds, not
            real conversations.
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-[12.5px]">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left font-semibold px-3 py-2">Audience</th>
                  <th className="text-right font-semibold px-3 py-2">Answer</th>
                  <th className="text-right font-semibold px-3 py-2">Willing</th>
                  <th className="text-right font-semibold px-3 py-2">Can&apos;t talk</th>
                  <th className="text-right font-semibold px-3 py-2">Bot fails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(audiences).map(([key, a]) => (
                  <tr key={key}>
                    <td className="px-3 py-2 font-semibold text-slate-800">{a.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{pct(a.answer_rate, 0)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{pct(a.willing_rate, 0)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{pct(a.unavailable_rate, 0)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{pct(a.screen_fail_rate, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11.5px] text-slate-400">
            Whoever isn&apos;t willing, can&apos;t talk or hit a bot failure declines. Fault injection for the providers lives
            on Provider Monitoring.
          </p>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
      <dt className="text-[10.5px] uppercase tracking-wider font-semibold text-slate-400">{label}</dt>
      <dd className="text-slate-800 font-medium mt-0.5 truncate" title={typeof value === "string" ? value : undefined}>
        {value}
      </dd>
    </div>
  );
}
