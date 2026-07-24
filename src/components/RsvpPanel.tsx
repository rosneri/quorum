"use client";

import { useRef, useState } from "react";
import { rsvp } from "@/lib/actions";
import { NameField } from "./NameField";
import { useI18n } from "./I18nProvider";

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
  const { t } = useI18n();
  const [min, setMin] = useState(myMin);
  const formRef = useRef<HTMLFormElement>(null);
  const inRef = useRef<HTMLButtonElement>(null);

  function pickMin(n: number) {
    setMin(n);
    // already in? save the new threshold immediately instead of waiting for a re-tap
    if (myState === "IN") {
      requestAnimationFrame(() =>
        formRef.current?.requestSubmit(inRef.current ?? undefined)
      );
    }
  }

  return (
    <form ref={formRef} action={rsvp} className="flex flex-col gap-4">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="personalMin" value={min} />
      <NameField known={known} />

      <div className="flex flex-col gap-1.5">
        <span className="label">{t("illComeIf")}</span>
        <div className="strip">
          {[0, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="chip strip-pill"
              data-on={min === n}
              onClick={() => pickMin(n)}
            >
              {n === 0 ? t("anyone") : `${n}+`}
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>
          {min === 0 ? t("thresholdHint0") : t("thresholdHintN", { n: min })}
        </p>
      </div>

      <div className="flex gap-3">
        <button ref={inRef} name="state" value="IN" className="btn flex-1" data-on={myState === "IN"}>
          {myState === "IN" ? t("youreIn") : t("imIn")}
        </button>
        <button name="state" value="OUT" className="btn btn-quiet flex-1">
          {myState === "OUT" ? t("youreOut") : t("cantMakeIt")}
        </button>
      </div>
    </form>
  );
}
