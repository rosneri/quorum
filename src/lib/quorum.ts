export type RsvpLike = {
  userId: string;
  state: "IN" | "MAYBE" | "OUT";
  personalMin: number;
};

/** A plan is "on" once this many people are in. Plans have no upper limit. */
export const MIN_TO_HAPPEN = 2;

export type QuorumResult = {
  /** userIds actually attending after personal thresholds cascade */
  attending: string[];
  /** userIds who said IN but whose personal minimum isn't met */
  waiting: string[];
  confirmed: boolean;
};

/**
 * Fixed-point attendance resolution.
 *
 * Everyone who said IN starts as attending. Anyone whose personalMin exceeds
 * the current attending count (which includes themselves) drops out; dropping
 * out shrinks the count, which can cascade. Dropping the person with the
 * highest personal minimum first yields the unique maximal stable set.
 */
export function resolveQuorum(rsvps: RsvpLike[]): QuorumResult {
  const ins = rsvps.filter((r) => r.state === "IN");
  const pool = [...ins].sort((a, b) => a.personalMin - b.personalMin);

  while (pool.length > 0) {
    const strictest = pool[pool.length - 1];
    if (strictest.personalMin <= pool.length) break;
    pool.pop();
  }

  const attending = pool.map((r) => r.userId);
  const attendingSet = new Set(attending);
  return {
    attending,
    waiting: ins.map((r) => r.userId).filter((id) => !attendingSet.has(id)),
    confirmed: attending.length >= MIN_TO_HAPPEN,
  };
}

// ---------------------------------------------------------------------------
// Unified conditional-time voting
//
// An event has 1..N candidate times. Each person has one Rsvp (their overall
// intent + personalMin threshold) and votes for the times that work for them.
// The threshold cascades PER candidate time: your interest in a time only
// counts once that time has enough committed people — so nobody has to commit
// to (or even signal interest in) a time unless the conditions match.
//
// A single-time event needs no explicit votes: being IN implies the sole time
// works for you, so it behaves exactly like a classic RSVP.
// ---------------------------------------------------------------------------

export type OptionLike = { id: string; startsAt: Date };
export type VoteLike = { optionId: string; userId: string };
export type RsvpFull = { userId: string; state: "IN" | "MAYBE" | "OUT"; personalMin: number };
export type AvailLike = { userId: string; from: Date; until: Date | null };

export type OptionResolution = {
  optionId: string;
  startsAt: Date;
  /** IN users who voted this time, before thresholds (raw interest) */
  voters: string[];
  /** voters who clear the per-time cascade — actually counted as attending */
  attending: string[];
  /** userIds who marked themselves free at this time (soft signal) */
  free: string[];
};

export type EventResolution = {
  perOption: Map<string, OptionResolution>;
  leaderOptionId: string | null;
  confirmed: boolean;
};

/**
 * Resolve a unified event. Returns per-option attendance (threshold-cleared),
 * the current live leader (most attending → most interested → most free →
 * earliest), and whether the leader clears quorum.
 *
 * `isAvailableAt` is injected to keep this module free of availability imports.
 */
export function resolveEvent(
  options: OptionLike[],
  votes: VoteLike[],
  rsvps: RsvpFull[],
  avails: AvailLike[] = [],
  isAvailableAt: (a: AvailLike, t: Date) => boolean = () => false,
): EventResolution {
  const minByUser = new Map(rsvps.map((r) => [r.userId, r.personalMin]));
  const inUsers = new Set(rsvps.filter((r) => r.state === "IN").map((r) => r.userId));
  const single = options.length === 1;

  const votersByOption = new Map<string, string[]>();
  for (const o of options) votersByOption.set(o.id, []);
  if (single && options[0]) {
    // single time: every IN user implicitly works for it
    votersByOption.set(options[0].id, [...inUsers]);
  } else {
    for (const v of votes) {
      if (inUsers.has(v.userId) && votersByOption.has(v.optionId)) {
        votersByOption.get(v.optionId)!.push(v.userId);
      }
    }
  }

  const perOption = new Map<string, OptionResolution>();
  for (const o of options) {
    const voters = [...new Set(votersByOption.get(o.id) ?? [])];
    const cascade = resolveQuorum(
      voters.map((userId) => ({ userId, state: "IN" as const, personalMin: minByUser.get(userId) ?? 0 })),
    );
    const free = [...new Set(avails.filter((a) => isAvailableAt(a, o.startsAt)).map((a) => a.userId))];
    perOption.set(o.id, { optionId: o.id, startsAt: o.startsAt, voters, attending: cascade.attending, free });
  }

  let leader: OptionResolution | null = null;
  for (const o of options) {
    const r = perOption.get(o.id)!;
    if (
      !leader ||
      r.attending.length > leader.attending.length ||
      (r.attending.length === leader.attending.length && r.voters.length > leader.voters.length) ||
      (r.attending.length === leader.attending.length &&
        r.voters.length === leader.voters.length &&
        r.free.length > leader.free.length) ||
      (r.attending.length === leader.attending.length &&
        r.voters.length === leader.voters.length &&
        r.free.length === leader.free.length &&
        r.startsAt.getTime() < leader.startsAt.getTime())
    ) {
      leader = r;
    }
  }

  return {
    perOption,
    leaderOptionId: leader?.optionId ?? null,
    confirmed: (leader?.attending.length ?? 0) >= MIN_TO_HAPPEN,
  };
}
