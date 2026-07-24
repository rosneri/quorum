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
 * The Quorum brand mark (mirrors src/app/icon.svg): a little gathering of three
 * dots reaching quorum, one already "in". Built from divs so Satori renders it
 * reliably. Sized 60px to sit beside the 40px wordmark.
 */
function LogoMark() {
  const dot = (left: number, top: number, fill: string) => ({
    position: "absolute" as const,
    width: 14,
    height: 14,
    borderRadius: 999,
    background: fill,
    left,
    top,
  });
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: 60,
        height: 60,
        borderRadius: 16,
        background: "#ef6a53",
      }}
    >
      <div style={dot(14, 30, PAPER)} />
      <div style={dot(33, 30, PAPER)} />
      <div style={dot(23, 15, "#57c98a")} />
    </div>
  );
}

// Characters that read left-to-right (Latin, digits, and the punctuation that
// travels with a name, time or URL).
const LTR_RUN = /[A-Za-z0-9@._:/+-]/;

/**
 * Satori (next/og) doesn't run the Unicode bidi algorithm, so right-to-left
 * text is drawn in logical order and comes out reversed. Reorder it to visual
 * order ourselves: reverse the whole string, then flip each maximal LTR run
 * (a name, time, etc.) back to its natural direction. Good enough for our mix
 * of Hebrew with the odd Latin name or number; Latin-only text is unchanged.
 */
function toVisualRtl(text: string): string {
  const chars = [...text].reverse();
  for (let i = 0; i < chars.length; ) {
    if (!LTR_RUN.test(chars[i])) {
      i++;
      continue;
    }
    let j = i;
    while (j < chars.length && LTR_RUN.test(chars[j])) j++;
    const run = chars.slice(i, j).reverse();
    for (let k = i; k < j; k++) chars[k] = run[k - i];
    i = j;
  }
  return chars.join("");
}

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
  // Reorder RTL text to visual order since Satori won't (see toVisualRtl).
  const show = dir === "rtl" ? toVisualRtl : (s: string) => s;
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
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <LogoMark />
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em" }}>Quorum</div>
          </div>
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
              {show(pill.label)}
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
            {show(title)}
          </div>
          {subtitle && (
            <div style={{ fontSize: 42, fontWeight: 500, color: INK_2, display: "flex" }}>
              {show(subtitle)}
            </div>
          )}
        </div>
      </div>
    ),
    OG_SIZE
  );
}
