import { resolveEvent } from "./quorum";

type OptionWithVotes = { id: string; startsAt: Date; votes: { userId: string }[] };
type RsvpRow = { userId: string; state: "IN" | "MAYBE" | "OUT"; personalMin: number };

export type PlanTimingData = {
  /** The decided time — a single-time plan's slot or a confirmed poll winner. */
  chosen: Date | null;
  /** Earliest / latest candidate time, for the "date range" of a poll. */
  rangeStart: Date | null;
  rangeEnd: Date | null;
  /** The current front-runner time while a poll is still undecided. */
  leading: Date | null;
  /** Whether there's more than one candidate time (so a range is meaningful). */
  multi: boolean;
};

/**
 * Compact timing summary for a plan list item: the chosen date when decided,
 * otherwise the candidate date range and the live leading time. Votes/rsvps are
 * used to pick the leader the same way the event page does (availability isn't
 * factored in here — the event page remains the source of truth).
 */
export function planTiming(e: {
  startsAt: Date | null;
  pollOptions: OptionWithVotes[];
  rsvps: RsvpRow[];
}): PlanTimingData {
  const opts = [...e.pollOptions].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const rangeStart = opts[0]?.startsAt ?? null;
  const rangeEnd = opts.at(-1)?.startsAt ?? null;

  let leading: Date | null = null;
  if (!e.startsAt && opts.length) {
    const votes = opts.flatMap((o) => o.votes.map((v) => ({ optionId: o.id, userId: v.userId })));
    const res = resolveEvent(opts, votes, e.rsvps);
    leading = res.leaderOptionId
      ? opts.find((o) => o.id === res.leaderOptionId)?.startsAt ?? null
      : null;
  }

  return { chosen: e.startsAt, rangeStart, rangeEnd, leading, multi: opts.length > 1 };
}
