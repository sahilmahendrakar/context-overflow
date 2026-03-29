import crypto from "crypto";
import { db } from "@/lib/firebase";
import type { Group, GroupMember, Agent } from "@/lib/data";

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

function generateInviteCode(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function createGroup(params: {
  name: string;
  slug: string;
  description?: string;
  creatorAgentId: string;
}): Promise<{ group: Group } | { error: string }> {
  const slug = params.slug.toLowerCase();

  if (!SLUG_REGEX.test(slug)) {
    return { error: "Invalid slug. Use 3-50 lowercase alphanumeric characters and hyphens." };
  }

  const existing = await db
    .collection("groups")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (!existing.empty) {
    return { error: "A group with this slug already exists." };
  }

  const now = new Date().toISOString();
  const inviteCode = generateInviteCode();

  const groupRef = db.collection("groups").doc();
  const memberRef = db.collection("group_members").doc();

  const batch = db.batch();

  const groupData = {
    name: params.name,
    slug,
    description: params.description || "",
    createdBy: params.creatorAgentId,
    inviteCode,
    createdAt: now,
  };

  batch.set(groupRef, groupData);
  batch.set(memberRef, {
    groupId: groupRef.id,
    agentId: params.creatorAgentId,
    role: "admin",
    joinedAt: now,
  });

  await batch.commit();

  return {
    group: { id: groupRef.id, ...groupData },
  };
}

export async function getGroupBySlug(slug: string): Promise<Group | null> {
  const snapshot = await db
    .collection("groups")
    .where("slug", "==", slug.toLowerCase())
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Group;
}

export async function getGroupByInviteCode(inviteCode: string): Promise<Group | null> {
  const snapshot = await db
    .collection("groups")
    .where("inviteCode", "==", inviteCode)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Group;
}

export async function listUserGroups(agentId: string): Promise<(GroupMember & { group: Group })[]> {
  const memberships = await db
    .collection("group_members")
    .where("agentId", "==", agentId)
    .get();

  if (memberships.empty) return [];

  const groupIds = memberships.docs.map((doc) => doc.data().groupId as string);
  const groupDocs = await db.getAll(
    ...groupIds.map((id) => db.collection("groups").doc(id))
  );

  const groups: Record<string, Group> = {};
  for (const doc of groupDocs) {
    if (doc.exists) {
      groups[doc.id] = { id: doc.id, ...doc.data() } as Group;
    }
  }

  return memberships.docs
    .map((doc) => {
      const data = doc.data();
      const group = groups[data.groupId];
      if (!group) return null;
      return {
        id: doc.id,
        groupId: data.groupId,
        agentId: data.agentId,
        role: data.role,
        joinedAt: data.joinedAt,
        group,
      } as GroupMember & { group: Group };
    })
    .filter((m): m is GroupMember & { group: Group } => m !== null);
}

export async function joinGroup(
  agentId: string,
  inviteCode: string
): Promise<{ group: Group } | { error: string }> {
  const group = await getGroupByInviteCode(inviteCode);
  if (!group) {
    return { error: "Invalid invite code." };
  }

  const existing = await db
    .collection("group_members")
    .where("groupId", "==", group.id)
    .where("agentId", "==", agentId)
    .limit(1)
    .get();

  if (!existing.empty) {
    return { group };
  }

  await db.collection("group_members").add({
    groupId: group.id,
    agentId,
    role: "member",
    joinedAt: new Date().toISOString(),
  });

  return { group };
}

export async function regenerateInviteCode(groupId: string): Promise<string> {
  const newCode = generateInviteCode();
  await db.collection("groups").doc(groupId).update({ inviteCode: newCode });
  return newCode;
}

export async function getMembers(
  groupId: string
): Promise<(GroupMember & { agent: Agent | null })[]> {
  const snapshot = await db
    .collection("group_members")
    .where("groupId", "==", groupId)
    .get();

  if (snapshot.empty) return [];

  const agentIds = snapshot.docs.map((doc) => doc.data().agentId as string);
  const agentDocs = await db.getAll(
    ...agentIds.map((id) => db.collection("agents").doc(id))
  );

  const agents: Record<string, Agent> = {};
  for (const doc of agentDocs) {
    if (doc.exists) {
      const data = doc.data()!;
      agents[doc.id] = {
        id: doc.id,
        username: data.username,
        reputation: data.reputation ?? 0,
        createdAt: data.createdAt,
      };
    }
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      groupId: data.groupId,
      agentId: data.agentId,
      role: data.role,
      joinedAt: data.joinedAt,
      agent: agents[data.agentId] || null,
    } as GroupMember & { agent: Agent | null };
  });
}

export async function removeMember(
  groupId: string,
  agentId: string
): Promise<boolean> {
  const snapshot = await db
    .collection("group_members")
    .where("groupId", "==", groupId)
    .where("agentId", "==", agentId)
    .limit(1)
    .get();

  if (snapshot.empty) return false;

  await snapshot.docs[0].ref.delete();
  return true;
}
