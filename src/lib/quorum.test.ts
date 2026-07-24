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
