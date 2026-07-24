"use client";

import { useState } from "react";
import { renameGroup, closeGroup, kickMember, leaveGroup } from "@/lib/actions";
import { useI18n } from "./I18nProvider";
import { SubmitButton } from "./SubmitButton";

export function LeaveGroupButton({ groupId }: { groupId: string }) {
  const { t } = useI18n();
  return (
    <form
      action={leaveGroup}
      onSubmit={(e) => {
        if (!confirm(t("confirmLeaveGroup"))) e.preventDefault();
      }}
    >
      <input type="hidden" name="groupId" value={groupId} />
      <SubmitButton
        className="flex items-center gap-1.5 text-sm font-semibold"
        style={{ color: "var(--color-accent-3)" }}
      >
        {t("leaveGroup")}
      </SubmitButton>
    </form>
  );
}

/** The group name in the header; the admin can tap to rename it inline. */
export function EditableGroupTitle({ groupId, name }: { groupId: string; name: string }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate text-2xl font-extrabold">{name}</h1>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={t("renameGroup")}
          className="chip shrink-0"
        >
          ✏️
        </button>
      </div>
    );
  }

  return (
    <form action={renameGroup} className="flex min-w-0 items-center gap-2">
      <input type="hidden" name="groupId" value={groupId} />
      <input
        name="groupName"
        defaultValue={name}
        required
        maxLength={60}
        autoFocus
        aria-label={t("renameGroup")}
        className="field min-w-0 flex-1 py-1.5 text-lg font-bold"
      />
      <SubmitButton className="btn btn-quiet shrink-0 px-3 py-1.5 text-sm">
        {t("saveName")}
      </SubmitButton>
      <button
        type="button"
        onClick={() => setEditing(false)}
        aria-label={t("cancel")}
        className="chip shrink-0"
      >
        ✕
      </button>
    </form>
  );
}

/** Delete the whole group (admin only), guarded by a confirmation dialog. */
export function DeleteGroupButton({ groupId }: { groupId: string }) {
  const { t } = useI18n();
  return (
    <form
      action={closeGroup}
      onSubmit={(e) => {
        if (!confirm(t("confirmCloseGroup"))) e.preventDefault();
      }}
    >
      <input type="hidden" name="groupId" value={groupId} />
      <SubmitButton
        aria-label={t("deleteGroup")}
        title={t("deleteGroup")}
        className="chip"
        style={{ color: "var(--color-accent-3)" }}
      >
        🗑️
      </SubmitButton>
    </form>
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
