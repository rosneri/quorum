export type AvailabilityLike = {
  userId: string;
  from: Date;
  until: Date | null;
};

/** How far a "specific time" availability stretches in each direction. */
export const SPECIFIC_TOLERANCE_MS = 45 * 60_000;

export function isAvailableAt(a: AvailabilityLike, t: Date): boolean {
  if (a.until) {
    return a.from.getTime() <= t.getTime() && t.getTime() <= a.until.getTime();
  }
  return Math.abs(a.from.getTime() - t.getTime()) <= SPECIFIC_TOLERANCE_MS;
}

/** userIds available at t. */
export function availableUserIds(avails: AvailabilityLike[], t: Date): string[] {
  return avails.filter((a) => isAvailableAt(a, t)).map((a) => a.userId);
}
