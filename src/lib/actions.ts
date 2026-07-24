"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { getUserId, setUserCookie } from "./auth";
import { syncEventStatus } from "./status";
import { availableUserIds } from "./availability";

async function ensureUser(name?: string): Promise<string> {
  const existing = await getUserId();
  if (existing) {
    const found = await prisma.user.findUnique({ where: { id: existing } });
    if (found) return existing;
  }
  const trimmed = name?.trim();
  if (!trimmed) redirect("/");
  const user = await prisma.user.create({ data: { name: trimmed.slice(0, 40) } });
  await setUserCookie(user.id);
  return user.id;
}

export async function onboard(formData: FormData) {
  await ensureUser(String(formData.get("name") ?? ""));
  const to = String(formData.get("redirectTo") ?? "/");
  redirect(to.startsWith("/") ? to : "/");
}

export async function createGroup(formData: FormData) {
  const userId = await ensureUser(String(formData.get("name") ?? ""));
  const groupName = String(formData.get("groupName") ?? "").trim();
  if (!groupName) return;
  const group = await prisma.group.create({
    data: {
      name: groupName.slice(0, 60),
      memberships: { create: { userId } },
    },
  });
  redirect(`/g/${group.id}`);
}

export async function joinGroup(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const group = await prisma.group.findUnique({ where: { inviteToken: token } });
  if (!group) redirect("/");
  const userId = await ensureUser(String(formData.get("name") ?? ""));
  await prisma.membership.upsert({
    where: { userId_groupId: { userId, groupId: group.id } },
    create: { userId, groupId: group.id },
    update: {},
  });
  redirect(`/g/${group.id}`);
}

export async function createEvent(formData: FormData) {
  const userId = await ensureUser(String(formData.get("name") ?? ""));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const emoji = String(formData.get("emoji") ?? "").trim() || null;
  const groupId = String(formData.get("groupId") ?? "") || null;
  const minQuorum = Math.min(20, Math.max(2, Number(formData.get("minQuorum") ?? 2)));
  const isPoll = formData.get("isPoll") === "1";

  let startsAt: Date | null = null;
  let flexMinutes: number | null = null;
  const optionDates: Date[] = [];

  // small grace so "right now" plans survive clock skew
  const earliest = Date.now() - 15 * 60_000;

  if (isPoll) {
    for (const raw of formData.getAll("option")) {
      const d = new Date(String(raw));
      if (!isNaN(d.getTime()) && d.getTime() >= earliest) optionDates.push(d);
    }
    if (optionDates.length < 2) return;
  } else {
    const d = new Date(String(formData.get("startsAt") ?? ""));
    if (isNaN(d.getTime()) || d.getTime() < earliest) return;
    startsAt = d;
    const flex = Number(formData.get("flexMinutes") ?? 0);
    flexMinutes = flex > 0 ? Math.min(240, flex) : null;
  }

  if (groupId) {
    const member = await prisma.membership.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!member) return;
  }

  const event = await prisma.event.create({
    data: {
      title: title.slice(0, 80),
      emoji,
      groupId,
      creatorId: userId,
      startsAt,
      flexMinutes,
      minQuorum,
      isPoll,
      pollOptions: isPoll
        ? { create: optionDates.map((d) => ({ startsAt: d })) }
        : undefined,
      // creator is in by default — one less tap
      rsvps: { create: { userId, state: "IN" } },
    },
  });
  redirect(`/e/${event.inviteToken}`);
}

export async function rsvp(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.status === "CANCELLED") return;
  const userId = await ensureUser(String(formData.get("name") ?? ""));

  const state = formData.get("state") === "OUT" ? ("OUT" as const) : ("IN" as const);
  const rawMin = formData.get("personalMin");
  const personalMin =
    rawMin == null ? undefined : Math.min(20, Math.max(0, Number(rawMin) || 0));

  await prisma.rsvp.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, state, personalMin: personalMin ?? 0 },
    update: { state, ...(personalMin !== undefined ? { personalMin } : {}) },
  });

  // The organizer bailing shouldn't kill the plan: hand it to someone who's
  // still in; with nobody left, call it off.
  if (state === "OUT" && event.creatorId === userId) {
    const successor = await prisma.rsvp.findFirst({
      where: { eventId, state: "IN", userId: { not: userId } },
      orderBy: { updatedAt: "asc" },
    });
    if (successor) {
      await prisma.event.update({
        where: { id: eventId },
        data: { creatorId: successor.userId },
      });
    } else {
      await prisma.event.update({
        where: { id: eventId },
        data: { status: "CANCELLED" },
      });
    }
  }

  await syncEventStatus(eventId);
  revalidatePath(`/e/${event.inviteToken}`);
}

export async function vote(formData: FormData) {
  const optionId = String(formData.get("optionId") ?? "");
  const option = await prisma.pollOption.findUnique({
    where: { id: optionId },
    include: { event: true },
  });
  if (!option || !option.event.isPoll) return;
  const userId = await ensureUser(String(formData.get("name") ?? ""));

  const existing = await prisma.pollVote.findUnique({
    where: { optionId_userId: { optionId, userId } },
  });
  if (existing) {
    await prisma.pollVote.delete({ where: { optionId_userId: { optionId, userId } } });
  } else {
    await prisma.pollVote.create({ data: { optionId, userId } });
  }
  revalidatePath(`/e/${option.event.inviteToken}`);
}

/** Everyone who signalled the locked time works for them gets RSVP'd IN (existing answers kept). */
async function autoRsvp(eventId: string, lockedAt: Date, voterIds: string[]) {
  const avails = await prisma.availability.findMany({ where: { eventId } });
  const ids = new Set([...voterIds, ...availableUserIds(avails, lockedAt)]);
  for (const userId of ids) {
    await prisma.rsvp.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, state: "IN" },
      update: {},
    });
  }
}

export async function lockOption(formData: FormData) {
  const optionId = String(formData.get("optionId") ?? "");
  const userId = await getUserId();
  if (!userId) return;
  const option = await prisma.pollOption.findUnique({
    where: { id: optionId },
    include: { event: true, votes: true },
  });
  if (!option || !option.event.isPoll) return;
  if (option.event.creatorId !== userId) return;

  await prisma.event.update({
    where: { id: option.eventId },
    data: { isPoll: false, startsAt: option.startsAt },
  });
  await autoRsvp(option.eventId, option.startsAt, option.votes.map((v) => v.userId));
  await syncEventStatus(option.eventId);
  revalidatePath(`/e/${option.event.inviteToken}`);
}

export async function lockCustomTime(formData: FormData) {
  const userId = await getUserId();
  if (!userId) return;
  const eventId = String(formData.get("eventId") ?? "");
  const at = new Date(String(formData.get("startsAt") ?? ""));
  if (isNaN(at.getTime()) || at.getTime() < Date.now() - 15 * 60_000) return;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || !event.isPoll || event.creatorId !== userId) return;

  await prisma.event.update({
    where: { id: eventId },
    data: { isPoll: false, startsAt: at },
  });
  await autoRsvp(eventId, at, []);
  await syncEventStatus(eventId);
  revalidatePath(`/e/${event.inviteToken}`);
}

export async function setAvailability(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || !event.isPoll || event.status === "CANCELLED") return;
  const userId = await ensureUser(String(formData.get("name") ?? ""));

  if (formData.get("clear") === "1") {
    await prisma.availability.deleteMany({ where: { eventId, userId } });
    revalidatePath(`/e/${event.inviteToken}`);
    return;
  }

  const from = new Date(String(formData.get("from") ?? ""));
  if (isNaN(from.getTime())) return;
  const untilRaw = String(formData.get("until") ?? "");
  let until: Date | null = untilRaw ? new Date(untilRaw) : null;
  if (until && (isNaN(until.getTime()) || until.getTime() <= from.getTime())) until = null;

  await prisma.availability.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, from, until },
    update: { from, until },
  });
  revalidatePath(`/e/${event.inviteToken}`);
}

export async function cancelEvent(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const userId = await getUserId();
  if (!userId) return;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.creatorId !== userId) return;
  await prisma.event.update({ where: { id: eventId }, data: { status: "CANCELLED" } });
  revalidatePath(`/e/${event.inviteToken}`);
}
