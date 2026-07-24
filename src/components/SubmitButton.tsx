"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button with a built-in pending state: while its form's server action
 * runs, it disables and shows a spinner. Drop-in for any <button> in a form.
 *
 * In a form with several submit buttons (e.g. the RSVP IN/MAYBE/OUT row), only
 * the button that was actually clicked spins; the others just disable. We tell
 * them apart via the submitted FormData exposed by useFormStatus.
 */
export function SubmitButton({
  children,
  disabled,
  ref,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const { pending, data } = useFormStatus();
  // A named button is the submitter when its name/value matches the payload;
  // an unnamed button (a form's lone submit) is always the submitter.
  const isSubmitter =
    props.name != null && props.value != null
      ? data?.get(String(props.name)) === String(props.value)
      : true;
  const spinning = pending && isSubmitter;
  return (
    <button {...props} ref={ref} disabled={pending || disabled} data-pending={spinning}>
      {spinning ? <span className="spinner" aria-hidden /> : null}
      {children}
    </button>
  );
}
