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
