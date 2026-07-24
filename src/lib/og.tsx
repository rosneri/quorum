import { ImageResponse } from "next/og";

/** Shared canvas for every Open Graph image so cards read as one family. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const PAPER = "#f8f6ef";
const INK = "#1c1a17";
const INK_2 = "#6b6558";
const MINT = "#bfe8cf";
const ACCENT = "#ffe08a";

type Pill = { label: string; tone?: "mint" | "accent" | "quiet" };

/**
 * Renders a branded card: a big emoji + title, a muted subtitle line, and an
 * optional status pill. Used by the app, event, and group OG routes.
 */
export function ogCard({
  emoji,
  title,
  subtitle,
  pill,
  dir = "ltr",
}: {
  emoji?: string | null;
  title: string;
  subtitle?: string;
  pill?: Pill;
  dir?: "ltr" | "rtl";
}) {
  const pillBg = pill?.tone === "accent" ? ACCENT : pill?.tone === "quiet" ? "#ece7db" : MINT;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: PAPER,
          color: INK,
          fontFamily: "sans-serif",
          direction: dir,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em" }}>Quorum</div>
          {pill && (
            <div
              style={{
                display: "flex",
                background: pillBg,
                borderRadius: 999,
                padding: "14px 30px",
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              {pill.label}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {emoji && <div style={{ fontSize: 120, lineHeight: 1 }}>{emoji}</div>}
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              // clamp very long titles so the card never overflows
              maxHeight: 280,
              overflow: "hidden",
              display: "flex",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 42, fontWeight: 500, color: INK_2, display: "flex" }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    ),
    OG_SIZE
  );
}
