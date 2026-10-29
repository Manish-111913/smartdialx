"use client";

import { useState } from "react";
import { useApi } from "@/lib/api";
import { num, pct } from "@/lib/format";
import { AUDIENCE_HINT } from "@/lib/labels";

const HOLD_OPTIONS = [20, 30, 45, 60];
const input =
  "h-8 px-3 rounded-lg bg-white text-slate-900 border border-[#E5EAF1] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-[12.5px] outline-none transition-all placeholder:text-slate-400 py-0";

function initialValues(campaign) {
  if (!campaign) {
    return {
      name: "",
      description: "",
      borrowers: "",
      provider: "A",
      mode: "predictive",
      screening: true,
      hold_s: "",
      no_agent_policy: "",
      audience: "standard",
      status: "RUNNING",
    };
  }
  return {
    name: campaign.name,
    description: campaign.description ?? "",
    borrowers: String(campaign.targets),
    provider: campaign.provider,
    mode: campaign.mode,
    screening: campaign.screening,
    hold_s: campaign.hold_s ? String(campaign.hold_s) : "",
    no_agent_policy: campaign.no_agent_policy ?? "",
    audience: campaign.audience ?? "standard",
    status: campaign.status,
  };
}

function payload(v) {
  const out = {
    name: v.name.trim(),
    description: v.description.trim() || null,
    provider: v.provider,
    mode: v.mode,
    screening: v.screening,
    audience: v.audience,
    // null means "follow the global setting"
    hold_s: v.hold_s ? Number(v.hold_s) : null,
    no_agent_policy: v.no_agent_policy || null,
  };
  return out;
}

/**
 * Create and edit share this form. When editing only the fields that changed are
 * sent, so a campaign that follows the global hold time keeps following it.
 */
export default function CampaignForm({ campaign, audiences, pool, busy, onSubmit, onCancel }) {
  const editing = Boolean(campaign);
  const [values, setValues] = useState(() => initialValues(campaign));
  const [errors, setErrors] = useState({});
  const { data: settings } = useApi("/settings", { interval: 0 });
  const global = settings?.settings?.screening;

  function set(key, value) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const problems = {};
    const name = values.name.trim();
    if (!name) problems.name = "Give the campaign a name.";
    else if (name.length > 80) problems.name = "Keep the name under 80 characters.";
    if (!editing) {
      const n = Number(values.borrowers);
      if (!values.borrowers || !Number.isInteger(n) || n < 1 || n > 2000) {
        problems.borrowers = "Enter a whole number from 1 to 2,000.";
      }
    }
    setErrors(problems);
    return Object.keys(problems).length === 0;
  }

  function body() {
    const next = payload(values);
    if (!editing) return { ...next, borrowers: Number(values.borrowers), status: values.status };
    const before = payload(initialValues(campaign));
    return Object.fromEntries(Object.entries(next).filter(([key, value]) => value !== before[key]));
  }

  function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(body());
  }

  return (
    <form id="campaign-form" className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <section className="flex flex-col gap-2.5">
        <span className="font-mono text-[10.5px] uppercase tracking-wider font-semibold text-blue-600">1. Basic information</span>
        <Field label="Campaign name" error={errors.name}>
          <input
            autoFocus
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Q4 Inactive Customer Re-engagement"
            className={`${input} ${errors.name ? "border-rose-300" : ""}`}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Call targets"
            error={errors.borrowers}
            hint={editing ? "Fixed once the campaign is created" : "Synthetic borrowers queued for this campaign"}
          >
            <input
              type="number"
              min="1"
              max="2000"
              disabled={editing}
              value={values.borrowers}
              onChange={(e) => set("borrowers", e.target.value)}
              placeholder="250"
              className={`${input} font-mono disabled:bg-slate-50 disabled:text-slate-500 ${errors.borrowers ? "border-rose-300" : ""}`}
            />
          </Field>
          <Field label="Mock provider">
            <select value={values.provider} onChange={(e) => set("provider", e.target.value)} className={`${input} px-2.5 cursor-pointer`}>
              <option value="A">Provider A (fast and reliable)</option>
              <option value="B">Provider B (slow and unreliable)</option>
            </select>
          </Field>
        </div>
        <Field label="Description">
          <textarea
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Who this campaign calls and why"
            className="px-3 py-1.5 rounded-lg bg-white text-slate-900 border border-[#E5EAF1] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-[12.5px] outline-none transition-all placeholder:text-slate-400 resize-none h-16"
          />
        </Field>
      </section>

      <section className="flex flex-col gap-2.5 pt-3 border-t border-[#E5EAF1]">
        <span className="font-mono text-[10.5px] uppercase tracking-wider font-semibold text-blue-600">2. Dialing &amp; screening</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-slate-800">Dialing mode</span>
            {[
              { value: "predictive", label: "Predictive", hint: "Dials ahead of free agents from the observed answer rate" },
              { value: "progressive", label: "Progressive", hint: "One call per agent who is already reserved" },
            ].map((m) => (
              <label
                key={m.value}
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                  values.mode === m.value ? "bg-blue-50/70 border-blue-300" : "bg-slate-50 border-[#E5EAF1] hover:bg-blue-50/50 hover:border-blue-200"
                }`}
              >
                <input
                  type="radio"
                  name="dial_mode"
                  checked={values.mode === m.value}
                  onChange={() => set("mode", m.value)}
                  className="text-blue-600 focus:ring-blue-600"
                />
                <span className="flex flex-col">
                  <span className="text-[12px] font-semibold text-slate-900">{m.label}</span>
                  <span className="font-mono text-[9.5px] text-slate-400 leading-snug">{m.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-slate-800">AI voice screening</span>
            <div className="p-2.5 bg-slate-50 border border-[#E5EAF1] rounded-lg flex flex-col justify-between gap-1.5 h-full">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-900 font-semibold">{values.screening ? "Enabled" : "Disabled"}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={values.screening}
                    onChange={(e) => set("screening", e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
              <span className="text-[10.5px] text-slate-500 leading-snug">
                A mock bot calls first. Only people it records as willing are transferred to an agent.
              </span>
            </div>
          </div>
        </div>

        {values.screening && (
          <div className="p-3 bg-purple-50/60 rounded-xl flex flex-col gap-2.5 border border-purple-200/60">
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-purple-900 uppercase font-semibold">
              <span className="material-symbols-outlined text-[15px]">tune</span>
              Screening parameters
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <SmallField label="Max wait for an agent">
                <select value={values.hold_s} onChange={(e) => set("hold_s", e.target.value)} className="h-7 px-2 bg-white text-slate-800 rounded-md text-[11.5px] border border-purple-200 py-0">
                  <option value="">
                    Global setting{global ? ` (${global.hold_s}s)` : ""}
                  </option>
                  {HOLD_OPTIONS.map((s) => (
                    <option key={s} value={String(s)}>
                      {s} seconds
                    </option>
                  ))}
                </select>
              </SmallField>
              <SmallField label="If no agent frees up">
                <select
                  value={values.no_agent_policy}
                  onChange={(e) => set("no_agent_policy", e.target.value)}
                  className="h-7 px-2 bg-white text-slate-800 rounded-md text-[11.5px] border border-purple-200 py-0"
                >
                  <option value="">
                    Global setting{global ? ` (${global.no_agent_policy === "end" ? "stop" : "callback later"})` : ""}
                  </option>
                  <option value="callback">Callback later</option>
                  <option value="end">Stop (no callback)</option>
                </select>
              </SmallField>
            </div>
          </div>
        )}

        <Field label="Screening outcome profile (mock audience)" hint={AUDIENCE_HINT}>
          <select value={values.audience} onChange={(e) => set("audience", e.target.value)} className={`${input} px-2.5 cursor-pointer`}>
            {Object.entries(audiences ?? {}).map(([key, a]) => (
              <option key={key} value={key}>
                {a.label}: answer {pct(a.answer_rate, 0)}, willing {pct(a.willing_rate, 0)}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="flex flex-col gap-2 pt-3 border-t border-[#E5EAF1]">
        <span className="font-mono text-[10.5px] uppercase tracking-wider font-semibold text-blue-600">3. Agent allocation &amp; safety</span>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-[#E5EAF1] flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-900">
            <span className="material-symbols-outlined text-[16px] text-blue-600">groups</span>
            {pool?.name ?? "Shared agent pool"}
          </span>
          {pool && (
            <span className="font-mono text-[11px] text-slate-500">
              {num(pool.online)} online / {num(pool.agents)} agents
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-500 -mt-1">{pool?.note ?? "All campaigns draw from one shared pool of agents."}</span>
        {!editing && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "RUNNING", label: "Start dialing now" },
              { value: "PAUSED", label: "Create paused" },
            ].map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => set("status", o.value)}
                className={`h-8 rounded-lg border text-[12px] font-semibold transition-colors ${
                  values.status === o.value ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-[#E5EAF1] text-slate-600 hover:bg-slate-50"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
        <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-start gap-2">
          <span className="material-symbols-outlined text-amber-600 text-[16px] shrink-0 mt-0.5">info</span>
          <span className="font-mono text-[10.5px] text-amber-800 leading-snug">
            The safety controller reviews every pacing request and can reduce or block new calls whatever mode you pick, for
            example when there aren&apos;t enough free agents or the provider is failing.
          </span>
        </div>
      </section>

      <div className="pt-3 border-t border-[#E5EAF1] flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-medium cursor-pointer transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="h-8 px-4 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-[12.5px] shadow-xs cursor-pointer transition-colors disabled:opacity-50"
        >
          {busy ? "Saving…" : editing ? "Save changes" : "Create campaign"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-semibold text-slate-800">{label}</span>
      {children}
      {error ? <span className="text-[11px] text-rose-600">{error}</span> : hint && <span className="text-[10.5px] text-slate-400 leading-snug">{hint}</span>}
    </div>
  );
}

function SmallField({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[9.5px] text-slate-500 font-semibold uppercase">{label}</span>
      {children}
    </div>
  );
}
