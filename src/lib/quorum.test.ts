import { describe, it, expect } from "vitest";
import { resolveQuorum, type RsvpLike } from "./quorum";

const r = (userId: string, personalMin = 0, state: "IN" | "OUT" = "IN"): RsvpLike => ({
  userId,
  state,
  personalMin,
});

describe("resolveQuorum", () => {
  it("confirms when enough people are in", () => {
    const q = resolveQuorum([r("a"), r("b")]);
    expect(q.attending).toEqual(["a", "b"]);
    expect(q.confirmed).toBe(true);
  });

  it("stays proposed below min quorum", () => {
    const q = resolveQuorum([r("a")]);
    expect(q.confirmed).toBe(false);
  });

  it("ignores OUT rsvps", () => {
    const q = resolveQuorum([r("a"), r("b", 0, "OUT")]);
    expect(q.attending).toEqual(["a"]);
    expect(q.confirmed).toBe(false);
  });

  it("drops a person whose personal minimum is unmet", () => {
    // b only comes if 3+ come, but only 2 are in
    const q = resolveQuorum([r("a"), r("b", 3)]);
    expect(q.attending).toEqual(["a"]);
    expect(q.waiting).toEqual(["b"]);
    expect(q.confirmed).toBe(false);
  });

  it("keeps personal minimums that count the person themselves", () => {
    // b needs 2 total including themselves — a + b = 2, satisfied
    const q = resolveQuorum([r("a"), r("b", 2)]);
    expect(q.attending).toEqual(["a", "b"]);
    expect(q.confirmed).toBe(true);
  });

  it("cascades drops", () => {
    // c needs 3: a+b+c=3 ok. But if c needed 4: c drops -> b needs 3, only 2 left -> b drops -> a alone
    const q = resolveQuorum([r("a"), r("b", 3), r("c", 4)]);
    expect(q.attending).toEqual(["a"]);
    expect(q.waiting).toEqual(["b", "c"]);
    expect(q.confirmed).toBe(false);
  });

  it("finds the maximal stable set", () => {
    const q = resolveQuorum([r("a"), r("b", 2), r("c", 3)]);
    expect(q.attending).toEqual(["a", "b", "c"]);
    expect(q.confirmed).toBe(true);
  });

  it("handles empty input", () => {
    const q = resolveQuorum([]);
    expect(q.attending).toEqual([]);
    expect(q.confirmed).toBe(false);
  });
});

import { resolveEvent, type RsvpFull, type OptionLike, type VoteLike } from "./quorum";
import { isAvailableAt } from "./availability";

const opt = (id: string, min = 0): OptionLike => ({ id, startsAt: new Date(Date.UTC(2026, 0, 1, 18 + min, 0, 0)) });
const rf = (userId: string, personalMin = 0, state: RsvpFull["state"] = "IN"): RsvpFull => ({ userId, state, personalMin });
const vt = (optionId: string, userId: string): VoteLike => ({ optionId, userId });

describe("resolveEvent", () => {
  it("single option behaves like a classic RSVP (IN users count, no explicit votes)", () => {
    const res = resolveEvent([opt("A")], [], [rf("a"), rf("b")], [], isAvailableAt);
    expect(res.leaderOptionId).toBe("A");
    expect(res.perOption.get("A")!.attending.sort()).toEqual(["a", "b"]);
    expect(res.confirmed).toBe(true);
  });

  it("per-slot cascade: interest only counts once a slot clears each threshold", () => {
    // A: a,b,c all want it (thresholds ok) -> 3 attending; B: only c wants it -> 1
    const res = resolveEvent(
      [opt("A", 0), opt("B", 1)],
      [vt("A", "a"), vt("A", "b"), vt("A", "c"), vt("B", "c")],
      [rf("a"), rf("b"), rf("c")],
      [],
      isAvailableAt,
    );
    expect(res.leaderOptionId).toBe("A");
    expect(res.perOption.get("A")!.attending.length).toBe(3);
    expect(res.perOption.get("B")!.attending.length).toBe(1);
    expect(res.confirmed).toBe(true);
  });

  it("a high personal threshold keeps you from counting for a thin slot", () => {
    // b needs >=3 but slot B only has b -> b drops, B has 0 attending
    const res = resolveEvent(
      [opt("A", 0), opt("B", 1)],
      [vt("A", "a"), vt("A", "b"), vt("B", "b")],
      [rf("a", 0), rf("b", 3)],
      [],
      isAvailableAt,
    );
    // On A: a(min0)+b(min3) -> pool size 2 < 3 so b drops, only a stays
    expect(res.perOption.get("A")!.attending).toEqual(["a"]);
    expect(res.perOption.get("B")!.attending).toEqual([]);
    expect(res.confirmed).toBe(false);
  });

  it("MAYBE/OUT voters do not count toward a slot", () => {
    const res = resolveEvent(
      [opt("A")],
      [vt("A", "a"), vt("A", "b"), vt("A", "c")],
      [rf("a"), rf("b", 0, "MAYBE"), rf("c", 0, "OUT")],
      [],
      isAvailableAt,
    );
    expect(res.perOption.get("A")!.attending).toEqual(["a"]);
  });

  it("leader breaks ties by raw interest then earliest", () => {
    // A and B each end with 1 attending; A has more raw voters -> A leads
    const res = resolveEvent(
      [opt("A", 0), opt("B", 2)],
      [vt("A", "a"), vt("B", "b")],
      [rf("a"), rf("b")],
      [],
      isAvailableAt,
    );
    expect(res.perOption.get("A")!.attending).toEqual(["a"]);
    expect(res.perOption.get("B")!.attending).toEqual(["b"]);
    expect(res.leaderOptionId).toBe("A");
  });
});
