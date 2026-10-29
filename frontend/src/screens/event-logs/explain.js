// What each processing status and recovery action means, in plain words. These
// describe what backend/src/smartdialx/events.py and recovery.py actually do.

export const STATUS_FILTERS = [
  "processed",
  "confirmation",
  "ignored_stale",
  "ignored_late",
  "rejected_invalid",
  "orphan",
  "pending",
  "duplicate",
  "reconciled",
];

export const EXTRA_STATUS_LABELS = {
  duplicate: "Delivered more than once",
  reconciled: "Replayed by recovery",
};

export const STATUS_EXPLAIN = {
  processed: "Applied: the call moved forward to the state this event reports.",
  confirmation: "The call was already in this state (our own write got there first), so nothing changed.",
  ignored_stale: "Arrived out of order. Applying it would move the call backwards, so it was recorded and skipped.",
  ignored_late: "Arrived after the call had already ended. Recorded for the audit trail, not applied.",
  rejected_invalid: "Not a valid transition for this call, so it was refused.",
  orphan: "No call matched this event's token or provider call id.",
  pending: "Stored but not processed yet; the worker picks it up on its next pass, even after a crash.",
};

export const RECOVERY_EXPLAIN = {
  released:
    "The reservation's lease ran out before any request was sent. The borrower went back to the queue and the agent was freed. Nothing was dialed.",
  not_placed:
    "The call request had timed out, so nobody knew whether the call existed. Recovery looked it up at the provider by its token, the provider had no such call, so it was marked not placed and queued for a normal retry. No second call was dialed blindly.",
  adopted:
    "The call request had timed out, but the provider lookup found the call, so recovery adopted it and let its events take over. Dialing again would have called the borrower twice.",
  gave_up:
    "The provider stayed unreachable for longer than the give-up limit, so the call was failed without redialing. If it turns up later, its events are recorded as late.",
  lost: "A live call went quiet and the provider had no record of it, so the call was ended and its agent freed.",
  reconciled:
    "A live call had no provider event for too long. Recovery asked the provider for its status and replayed the answer through the normal event path, so the usual duplicate and ordering rules applied.",
  transfer_adopted: "A transfer request had timed out. The provider confirmed the transfer happened, so it was marked accepted.",
  transfer_resent:
    "The borrower was still holding, so the transfer was resent with the same token. The provider ignores a repeated token, so it can't transfer twice.",
  transfer_released: "The provider refused the resent transfer. The agent was freed and the borrower kept holding for another agent.",
  agent_freed: "An agent was still marked busy for a call that had already ended. Recovery freed them.",
  worker_dead: "A worker stopped sending heartbeats and was marked dead. Leases on its reservations do the actual cleanup.",
};

function cell(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function eventsToCsv(events) {
  const cols = [
    "event_id",
    "type",
    "provider",
    "call",
    "campaign",
    "occurred_at",
    "received_at",
    "processed_at",
    "outcome",
    "status",
    "severity",
    "deliveries",
    "reason",
    "talk_seconds",
    "note",
  ];
  return [cols.join(","), ...events.map((e) => cols.map((c) => cell(e[c])).join(","))].join("\n");
}

export function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
