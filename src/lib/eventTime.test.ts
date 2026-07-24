import { describe, it, expect } from "vitest";
import { isLive, isPast, PAST_GRACE_MS } from "./eventTime";

const MIN = 60_000;
const now = Date.UTC(2026, 0, 1, 12, 0, 0);
const at = (msFromNow: number) => ({ isPoll: false, startsAt: new Date(now + msFromNow), flexMinutes: 0 as number | null });

describe("isLive / isPast", () => {
  it("a future plan is neither live nor past", () => {
    const e = at(30 * MIN);
    expect(isLive(e, now)).toBe(false);
    expect(isPast(e, now)).toBe(false);
  });

  it("a plan is live from its start until it ages out", () => {
    const e = at(-30 * MIN); // started 30 min ago, grace is 3h
    expect(isLive(e, now)).toBe(true);
    expect(isPast(e, now)).toBe(false);
  });

  it("live at the exact start moment", () => {
    const e = at(0);
    expect(isLive(e, now)).toBe(true);
  });

  it("a plan is past once start + flex + grace passes", () => {
    const e = at(-(PAST_GRACE_MS + MIN));
    expect(isLive(e, now)).toBe(false);
    expect(isPast(e, now)).toBe(true);
  });

  it("flex extends the live window before it ages out", () => {
    const start = -(PAST_GRACE_MS + 30 * MIN); // grace already elapsed...
    const e = { isPoll: false, startsAt: new Date(now + start), flexMinutes: 60 }; // ...but +60 flex keeps it live
    expect(isLive(e, now)).toBe(true);
    expect(isPast(e, now)).toBe(false);
  });

  it("polls and timeless plans are never live or past", () => {
    const poll = { isPoll: true, startsAt: null, flexMinutes: null };
    expect(isLive(poll, now)).toBe(false);
    expect(isPast(poll, now)).toBe(false);
  });
});
