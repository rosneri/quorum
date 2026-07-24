"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button with a built-in pending state: while its form's server action
 * runs, it disables and shows a spinner. Drop-in for any <button> in a form.
 */
export function SubmitButton({
  children,
  disabled,
  ref,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const { pending } = useFormStatus();
  return (
    <button {...props} ref={ref} disabled={pending || disabled} data-pending={pending}>
      {pending ? <span className="spinner" aria-hidden /> : null}
      {children}
    </button>
  );
}
