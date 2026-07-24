"use client";

import { renameGroup, closeGroup, kickMember } from "@/lib/actions";
import { useI18n } from "./I18nProvider";
import { SubmitButton } from "./SubmitButton";

export function GroupAdmin({ groupId, name }: { groupId: string; name: string }) {
  const { t } = useI18n();
  return (
    <section className="flex flex-col gap-3 rounded-2xl p-4" style={{ background: "var(--color-paper-2)" }}>
      <h2 className="label">{t("manageGroup")}</h2>
      <form action={renameGroup} className="flex items-center gap-2">
        <input type="hidden" name="groupId" value={groupId} />
        <input
          name="groupName"
          defaultValue={name}
          required
          maxLength={60}
          aria-label={t("renameGroup")}
          className="field flex-1"
        />
        <SubmitButton className="btn btn-quiet px-3 py-2 text-sm">{t("saveName")}</SubmitButton>
      </form>
      <form
        action={closeGroup}
        onSubmit={(e) => {
          if (!confirm(t("confirmCloseGroup"))) e.preventDefault();
        }}
      >
        <input type="hidden" name="groupId" value={groupId} />
        <SubmitButton
          className="flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: "var(--color-accent-3)" }}
        >
          {t("closeGroup")}
        </SubmitButton>
      </form>
    </section>
  );
}

export function KickableMember({
  groupId,
  userId,
  name,
  isSelf,
  canKick,
}: {
  groupId: string;
  userId: string;
  name: string;
  isSelf: boolean;
  canKick: boolean;
}) {
  const { t } = useI18n();
  return (
    <span className="chip flex cursor-default items-center gap-1.5">
      {name}
      {isSelf ? ` (${t("you")})` : ""}
      {canKick && !isSelf && (
        <form
          action={kickMember}
          className="inline-flex"
          onSubmit={(e) => {
            if (!confirm(t("confirmKick", { name }))) e.preventDefault();
          }}
        >
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="userId" value={userId} />
          <SubmitButton
            aria-label={t("confirmKick", { name })}
            className="inline-flex items-center font-bold"
            style={{ color: "var(--color-accent-3)" }}
          >
            ✕
          </SubmitButton>
        </form>
      )}
    </span>
  );
}
