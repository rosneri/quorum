"use client";

import { useState } from "react";
import { useI18n } from "./I18nProvider";

export function ShareButton({ path, title }: { path: string; title: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user dismissed the sheet — fall through to copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button type="button" onClick={share} className="btn btn-quiet text-sm">
      {copied ? t("linkCopied") : t("inviteFriends")}
    </button>
  );
}
