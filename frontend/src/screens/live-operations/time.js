// How long a call has been going (live) or lasted (ended), in seconds, against the
// console clock in `now`. A live call counts from the most recent milestone it reached,
// so a connected call shows its talk time.
export function callDuration(c, now) {
  if (c.ended_at) {
    const start = c.sending_at ?? c.reserved_at;
    return start ? c.ended_at - start : null;
  }
  const start = c.connected_at ?? c.answered_at ?? c.sending_at ?? c.reserved_at;
  return start && now ? now - start : null;
}

export function durationHint(c) {
  if (c.ended_at) return "From dialing to the end of the call";
  if (c.connected_at) return "Talking with the agent";
  if (c.answered_at) return "Since the borrower answered";
  if (c.sending_at) return "Since the call was dialed";
  return "Since the call was reserved";
}
