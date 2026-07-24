import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Quorum — plans that happen when enough friends are in";

export default function Image() {
  return ogCard({
    emoji: "🎉",
    title: "Plans that happen when enough friends are in.",
    subtitle: "Share a link · everyone says if they're in · it confirms itself",
    pill: { label: "Quorum", tone: "mint" },
  });
}
