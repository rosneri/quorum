"use client";

import { cancelEvent } from "@/lib/actions";

export function CancelButton({ eventId }: { eventId: string }) {
  return (
    <form
      action={cancelEvent}
      onSubmit={(e) => {
        if (!confirm("Call off this plan for everyone?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="eventId" value={eventId} />
      <button className="text-sm font-semibold" style={{ color: "var(--color-accent-3)" }}>
        Call it off
      </button>
    </form>
  );
}
