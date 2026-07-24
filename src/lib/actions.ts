"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { getUserId, setUserCookie } from "./auth";
import { syncEventStatus } from "./status";

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

export async function setLocale(formData: FormData) {
  const locale = String(formData.get("locale") ?? "");
  if (locale !== "en" && locale !== "he") return;
  const { cookies } = await import("next/headers");
  const store = await cookies();
  store.set("locale", locale, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  revalidatePath("/", "layout");
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
      adminId: userId,
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

async function requireGroupAdmin(groupId: string) {
  const userId = await getUserId();
  if (!userId) return null;
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.adminId !== userId) return null;
  return group;
}

export async function renameGroup(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("groupName") ?? "").trim();
  if (!name) return;
  const group = await requireGroupAdmin(groupId);
  if (!group) return;
  await prisma.group.update({ where: { id: groupId }, data: { name: name.slice(0, 60) } });
  revalidatePath(`/g/${groupId}`);
}

export async function closeGroup(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const group = await requireGroupAdmin(groupId);
  if (!group) return;
  // events survive with groupId -> null (SetNull); their invite links keep working
  await prisma.group.delete({ where: { id: groupId } });
  redirect("/");
}

export async function kickMember(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const targetId = String(formData.get("userId") ?? "");
  const group = await requireGroupAdmin(groupId);
  if (!group || targetId === group.adminId) return;
  await prisma.membership.deleteMany({ where: { groupId, userId: targetId } });
  revalidatePath(`/g/${groupId}`);
}

/** Parse the `option` fields (UTC ISO) into future, de-duplicated dates. */
function parseOptionDates(formData: FormData): Date[] {
  const earliest = Date.now() - 15 * 60_000; // grace so "right now" survives clock skew
  const seen = new Set<number>();
  const out: Date[] = [];
  for (const raw of formData.getAll("option")) {
    const d = new Date(String(raw));
    if (!isNaN(d.getTime()) && d.getTime() >= earliest && !seen.has(d.getTime())) {
      seen.add(d.getTime());
      out.push(d);
    }
  }
  return out.sort((a, b) => a.getTime() - b.getTime());
}

export async function createEvent(formData: FormData) {
  const userId = await ensureUser(String(formData.get("name") ?? ""));
  const title = String(formData.get("title") ?? "").trim() || "Coffee";

  const emoji = String(formData.get("emoji") ?? "").trim() || null;
  const groupId = String(formData.get("groupId") ?? "") || null;

  // Every event carries 1..N candidate times. One time = fixed plan; several =
  // people pick, and the winner is decided automatically by the votes.
  const optionDates = parseOptionDates(formData);
  if (optionDates.length < 1) return;
  const multi = optionDates.length > 1;

  const flex = Number(formData.get("flexMinutes") ?? 0);
  const flexMinutes = flex > 0 ? Math.min(240, flex) : null;

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
      startsAt: multi ? null : optionDates[0],
      flexMinutes,
      isPoll: multi,
      publicVotes: formData.get("publicVotes") !== "0",
      pollOptions: { create: optionDates.map((d) => ({ startsAt: d })) },
      // creator is in by default — one less tap
      rsvps: { create: { userId, state: "IN" } },
    },
  });
  // For a multi-time plan the creator still picks which of their proposed
  // times actually work for them — no auto-votes. (A single-time plan needs
  // no vote: being IN implies the sole time works.)
  await syncEventStatus(event.id);
  redirect(`/e/${event.inviteToken}`);
}

export async function rsvp(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.status === "CANCELLED") return;
  const userId = await ensureUser(String(formData.get("name") ?? ""));

  const raw = formData.get("state");
  const state = raw === "OUT" ? ("OUT" as const) : raw === "MAYBE" ? ("MAYBE" as const) : ("IN" as const);
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
  if (!option || option.event.status === "CANCELLED") return;
  const userId = await ensureUser(String(formData.get("name") ?? ""));

  // voting a time means "count me in for it" — make sure they're participating
  await prisma.rsvp.upsert({
    where: { eventId_userId: { eventId: option.eventId, userId } },
    create: { eventId: option.eventId, userId, state: "IN" },
    update: {},
  });

  const existing = await prisma.pollVote.findUnique({
    where: { optionId_userId: { optionId, userId } },
  });
  if (existing) {
    await prisma.pollVote.delete({ where: { optionId_userId: { optionId, userId } } });
  } else {
    await prisma.pollVote.create({ data: { optionId, userId } });
  }
  await syncEventStatus(option.eventId);
  revalidatePath(`/e/${option.event.inviteToken}`);
}

export async function addAvailability(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.status === "CANCELLED") return;
  const userId = await ensureUser(String(formData.get("name") ?? ""));

  const from = new Date(String(formData.get("from") ?? ""));
  if (isNaN(from.getTime())) return;
  const untilRaw = String(formData.get("until") ?? "");
  let until: Date | null = untilRaw ? new Date(untilRaw) : null;
  if (until && (isNaN(until.getTime()) || until.getTime() <= from.getTime())) until = null;

  const count = await prisma.availability.count({ where: { eventId, userId } });
  if (count >= 10) return;

  await prisma.availability.create({ data: { eventId, userId, from, until } });
  revalidatePath(`/e/${event.inviteToken}`);
}

export async function removeAvailability(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const userId = await getUserId();
  if (!userId) return;
  const entry = await prisma.availability.findUnique({ where: { id }, include: { event: true } });
  if (!entry || entry.userId !== userId) return;
  await prisma.availability.delete({ where: { id } });
  revalidatePath(`/e/${entry.event.inviteToken}`);
}

export async function editEvent(formData: FormData) {
  const userId = await getUserId();
  if (!userId) return;
  const eventId = String(formData.get("eventId") ?? "");
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { pollOptions: true },
  });
  if (!event || event.creatorId !== userId || event.status === "CANCELLED") return;

  const title = String(formData.get("title") ?? "").trim() || "Coffee";
  const emoji = String(formData.get("emoji") ?? "").trim() || null;
  const flex = Number(formData.get("flexMinutes") ?? 0);
  const flexMinutes = flex > 0 ? Math.min(240, flex) : null;

  // Reconcile candidate times: keep the ones still submitted (with their votes),
  // add new ones, drop the rest. Existing RSVPs are untouched.
  const wanted = parseOptionDates(formData);
  if (wanted.length >= 1) {
    const existingByMs = new Map(event.pollOptions.map((o) => [o.startsAt.getTime(), o]));
    const wantedMs = new Set(wanted.map((d) => d.getTime()));
    const toDelete = event.pollOptions.filter((o) => !wantedMs.has(o.startsAt.getTime()));
    const toAdd = wanted.filter((d) => !existingByMs.has(d.getTime()));
    if (toDelete.length) {
      await prisma.pollOption.deleteMany({ where: { id: { in: toDelete.map((o) => o.id) } } });
    }
    if (toAdd.length) {
      await prisma.pollOption.createMany({
        data: toAdd.map((d) => ({ eventId, startsAt: d })),
      });
    }
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { title: title.slice(0, 80), emoji, flexMinutes, editedAt: new Date() },
  });
  await syncEventStatus(eventId);
  revalidatePath(`/e/${event.inviteToken}`);
  redirect(`/e/${event.inviteToken}`);
}

export async function leaveGroup(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const userId = await getUserId();
  if (!userId) return;
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { memberships: { orderBy: { joinedAt: "asc" } } },
  });
  if (!group) return;
  if (!group.memberships.some((m) => m.userId === userId)) return;

  await prisma.membership.deleteMany({ where: { groupId, userId } });

  // Admin leaving: hand the group to the earliest remaining member, or delete
  // it if nobody's left (mirrors the event organizer-handoff in rsvp).
  if (group.adminId === userId) {
    const successor = group.memberships.find((m) => m.userId !== userId);
    if (successor) {
      await prisma.group.update({ where: { id: groupId }, data: { adminId: successor.userId } });
    } else {
      await prisma.group.delete({ where: { id: groupId } });
    }
  }
  redirect("/");
}

export async function reopenEvent(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const userId = await getUserId();
  if (!userId) return;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "CANCELLED") return;
  // Only past participants (people who ever RSVP'd) can reopen — not any
  // link-holder who happens to open the cancelled plan.
  const priorRsvp = await prisma.rsvp.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  if (!priorRsvp) return;
  await prisma.event.update({ where: { id: eventId }, data: { status: "PROPOSED" } });
  // the reopener is in — otherwise the plan reopens empty and dies again
  await prisma.rsvp.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, state: "IN" },
    update: { state: "IN" },
  });
  await syncEventStatus(eventId);
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
