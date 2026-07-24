import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center gap-5 text-center">
      <span className="text-5xl">🤷</span>
      <h1 className="text-2xl font-extrabold">This plan doesn&apos;t exist</h1>
      <p style={{ color: "var(--color-ink-2)" }}>
        The link may be wrong, or the plan was deleted.
      </p>
      <Link href="/" className="btn">
        Back home
      </Link>
    </main>
  );
}
