"use client";

import { useState } from "react";
import { Button, Modal } from "@/components/ui";

const STATES = [
  { value: "AVAILABLE", label: "Available", hint: "Starts taking calls on the next pacing round" },
  { value: "PAUSED", label: "Paused", hint: "Logged in but not taking calls" },
  { value: "OFFLINE", label: "Offline", hint: "Added to the roster, logged out" },
];

export default function AddAgentModal({ open, busy, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [state, setState] = useState("AVAILABLE");
  const [error, setError] = useState(null);

  function close() {
    setName("");
    setState("AVAILABLE");
    setError(null);
    onClose();
  }

  async function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter the agent's full name.");
      return;
    }
    if (trimmed.length > 60) {
      setError("Keep the name under 60 characters.");
      return;
    }
    const created = await onCreate({ name: trimmed, state });
    if (created) close();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      width="max-w-md"
      title={
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[22px] text-indigo-600">person_add</span>
          Add New Agent
        </span>
      }
      subtitle="Adds an agent to the shared pool the simulated campaigns dial for."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="add-agent-form" disabled={busy}>
            {busy ? "Saving…" : "Save agent"}
          </Button>
        </div>
      }
    >
      <form id="add-agent-form" className="flex flex-col gap-space-md" onSubmit={submit} noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="agent-name" className="font-label-ui text-label-ui uppercase tracking-wider text-slate-500 font-semibold">
            Full name
          </label>
          <input
            id="agent-name"
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Rachel Hernandez"
            className={`h-9 px-3 rounded-lg bg-white border text-slate-900 font-body-sm text-body-sm focus:outline-none focus:ring-1 py-0 ${
              error ? "border-rose-300 focus:ring-rose-400" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
            }`}
          />
          {error && <span className="text-[11.5px] text-rose-600">{error}</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-label-ui text-label-ui uppercase tracking-wider text-slate-500 font-semibold">Starts as</span>
          <div className="grid grid-cols-3 gap-2">
            {STATES.map((s) => (
              <button
                key={s.value}
                type="button"
                title={s.hint}
                onClick={() => setState(s.value)}
                className={`h-9 rounded-lg border text-[12.5px] font-semibold transition-colors ${
                  state === s.value
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <span className="text-[11.5px] text-slate-500">{STATES.find((s) => s.value === state).hint}</span>
        </div>
      </form>
    </Modal>
  );
}
