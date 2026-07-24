"use client";

import { useRef, useState } from "react";
import { rsvp } from "@/lib/actions";
import { NameField } from "./NameField";
import { useI18n } from "./I18nProvider";
import { SubmitButton } from "./SubmitButton";

type State = "IN" | "MAYBE" | "OUT";

export function RsvpPanel({
  eventId,
  known,
  myState,
  myMin,
  lastOneIn,
}: {
  eventId: string;
  known: boolean;
  myState: State | null;
  myMin: number;
  /** true when this viewer going OUT would leave nobody in (plan gets called off) */
  lastOneIn: boolean;
}) {
  const { t } = useI18n();
  const [min, setMin] = useState(myMin);
  const formRef = useRef<HTMLFormElement>(null);
  const inRef = useRef<HTMLButtonElement>(null);

  // Picking a threshold is itself a (conditional) yes: submit as IN so a
  // "maybe"/"can't make it" turns into "count me in once enough people are".
  function pickMin(n: number) {
    setMin(n);
    requestAnimationFrame(() =>
      formRef.current?.requestSubmit(inRef.current ?? undefined)
    );
  }

  // The threshold only makes sense as a follow-up for people who haven't
  // committed — a nudge to reconsider — or to adjust an existing conditional in.
  const showThreshold = myState === "MAYBE" || myState === "OUT" || (myState === "IN" && min > 0);

  return (
    <form
      ref={formRef}
      action={rsvp}
      onSubmit={(e) => {
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.value === "OUT" && lastOneIn && !confirm(t("confirmLastOut"))) {
          e.preventDefault();
        }
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="personalMin" value={min} />
      <NameField known={known} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <SubmitButton
          ref={inRef}
          name="state"
          value="IN"
          className="btn flex-1 px-2"
          data-rsvp="in"
          data-on={myState === "IN"}
        >
          {myState === "IN" ? t("youreIn") : t("imIn")}
        </SubmitButton>
        <SubmitButton
          name="state"
          value="MAYBE"
          className="btn btn-quiet flex-1 px-2"
          data-rsvp="maybe"
          data-on={myState === "MAYBE"}
        >
          {myState === "MAYBE" ? t("youreMaybe") : t("maybe")}
        </SubmitButton>
        <SubmitButton
          name="state"
          value="OUT"
          className="btn btn-quiet flex-1 px-2"
          data-rsvp="out"
          data-on={myState === "OUT"}
        >
          {myState === "OUT" ? t("youreOut") : t("cantMakeIt")}
        </SubmitButton>
      </div>

      {showThreshold && (
        <div className="flex flex-col gap-1.5 pop-in">
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
      )}
    </form>
  );
}
