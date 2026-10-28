# How would you get most of the predictive benefit while keeping progressive's safety?

Separate the two things predictive dialing mixes together: deciding how many calls to
start, and deciding who takes a call when it's answered. Keep the second one
deterministic and only let the first one guess.

1. Every call ends up bound to exactly one agent, atomically, before a borrower can
   hear silence. Progressive calls get their agent before dialing. Predictive calls
   claim one at the moment of answer, in the same transaction that processes the
   ANSWERED event, from free agents or agents a few seconds from the end of wrap-up.
   The database refuses to give one agent two live calls. That part never estimates
   anything.

2. The only thing that's estimated is how far ahead of free agents we dial. Size that
   with a risk target, not an average: use an upper bound on the answer rate (being
   wrong high costs idle time, being wrong low costs abandons) and pick the largest
   batch where the chance of more answers than free agents stays small. Every decision
   records its inputs, so "why 17 and not 10" has a numeric answer.

3. Put a controller between the estimate and the dialer that never uses the
   estimate's own math. It recomputes hard limits from current state: bound calls
   never exceed free agents, unbound calls in flight never exceed a fixed multiple of
   free agents, plus breakers for abandon rate, sudden answer-rate jumps, missing
   data and provider errors. Any breaker drops the campaign back to progressive,
   which is safe by construction. The over-dial cap is also enforced inside the
   reservation transaction, so many workers can't add up to more than one worker is
   allowed.

4. Get utilization from places that don't add risk before over-dialing: count agents
   finishing wrap-up as capacity (built here), cut call setup time, and stop redialing
   numbers that never answer (not built).

5. Put a screening step in front of the agent where it fits the campaign: a bot finds
   out whether the borrower can and wants to talk, and only those people are handed to
   an agent, through the same atomic reservation. Nobody hears silence (the bot is on
   the line), and agents stop spending time on people who were never going to talk. In
   the mock prototype this raised productive agent time from 39.5% to 54.4% at a 20%
   answer rate when combined with predictive pacing (see screening.md). It made no
   sense with progressive pacing alone.

The honest limit: as soon as you start a call without a dedicated agent, zero
abandons is a target, not a guarantee. This design makes that risk explicit (a
configured per-decision probability), bounded (hard caps independent of the model),
self-correcting (abandon breaker forces progressive and has to be earned back), and
visible (every decision and abandon is recorded). If compliance requires an absolute
zero, run progressive and take utilization gains from points 1 and 4 only.

In the prototype: predictive raised utilization from 46.7% to 67.0% at a 20% answer
rate with 1.4% of answered calls abandoned. When the answer rate jumped from 20% to
70%, 7 calls were abandoned before the breakers moved the campaign back to
progressive (see results.md).
