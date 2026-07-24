import type { EventStatus } from "@/generated/prisma/enums";

const styles: Record<string, { bg: string; label: string }> = {
  CONFIRMED: { bg: "var(--color-mint)", label: "Confirmed 🎉" },
  PROPOSED: { bg: "var(--color-accent)", label: "Gathering" },
  CANCELLED: { bg: "var(--color-paper-3)", label: "Cancelled" },
  DONE: { bg: "var(--color-paper-3)", label: "Done" },
  POLL: { bg: "var(--color-accent-2)", label: "Voting" },
};

export function StatusChip({ status, isPoll }: { status: EventStatus; isPoll?: boolean }) {
  const s = isPoll && status === "PROPOSED" ? styles.POLL : styles[status];
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-bold"
      style={{ background: s.bg }}
    >
      {s.label}
    </span>
  );
}
