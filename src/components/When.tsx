"use client";

import { useSyncExternalStore } from "react";
import { formatWhen } from "@/lib/format";

const noop = () => () => {};

/** Formats a timestamp in the viewer's timezone (client-only to avoid server-TZ mismatch). */
export function When({ iso, flexMinutes }: { iso: string; flexMinutes?: number | null }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!mounted) return <span suppressHydrationWarning>…</span>;
  return <span>{formatWhen(new Date(iso), flexMinutes)}</span>;
}

/** Just the clock time, viewer-local. */
export function TimeOnly({ iso }: { iso: string }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!mounted) return <span suppressHydrationWarning>…</span>;
  return (
    <span>{new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
  );
}
