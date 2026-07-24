"use client";

import { useState } from "react";
import { rsvp } from "@/lib/actions";
import { NameField } from "./NameField";

export function RsvpPanel({
  eventId,
  known,
  myState,
  myMin,
}: {
  eventId: string;
  known: boolean;
  myState: "IN" | "OUT" | null;
  myMin: number;
}) {
  const [min, setMin] = useState(myMin);

  return (
    <form action={rsvp} className="flex flex-col gap-4">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="personalMin" value={min} />
      <NameField known={known} />

      <div className="flex flex-col gap-1.5">
        <span className="label">I&apos;ll come if at least…</span>
        <div className="flex items-center gap-2">
          {[0, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="chip"
              data-on={min === n}
              onClick={() => setMin(n)}
            >
              {n === 0 ? "Anyone" : `${n}+`}
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>
          {min === 0
            ? "You're in no matter how many come."
            : `You only count as attending once ${min} people (including you) are in.`}
        </p>
      </div>

      <div className="flex gap-3">
        <button name="state" value="IN" className="btn flex-1" data-on={myState === "IN"}>
          {myState === "IN" ? "You're in ✓" : "I'm in"}
        </button>
        <button name="state" value="OUT" className="btn btn-quiet flex-1">
          {myState === "OUT" ? "You're out ✓" : "Can't make it"}
        </button>
      </div>
    </form>
  );
}
