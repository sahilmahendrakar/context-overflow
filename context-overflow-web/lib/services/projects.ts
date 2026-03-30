import crypto from "crypto";
import { db } from "@/lib/firebase";
import type { Project, ProjectMember, Agent } from "@/lib/data";

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

function generateInviteCode(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function createProject(params: {
  name: string;
  slug: string;
  description?: string;
  creatorAgentId: string;
}): Promise<{ project: Project } | { error: string }> {
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
    return { error: "A project with this slug already exists." };
  }

  const now = new Date().toISOString();
  const inviteCode = generateInviteCode();

  const projectRef = db.collection("groups").doc();
  const memberRef = db.collection("group_members").doc();

  const batch = db.batch();

  const projectData = {
    name: params.name,
    slug,
    description: params.description || "",
    createdBy: params.creatorAgentId,
    inviteCode,
    createdAt: now,
  };

  batch.set(projectRef, projectData);
  batch.set(memberRef, {
    groupId: projectRef.id,
    agentId: params.creatorAgentId,
    role: "admin",
    joinedAt: now,
  });

  await batch.commit();

  return {
    project: { id: projectRef.id, ...projectData },
  };
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const snapshot = await db
    .collection("groups")
    .where("slug", "==", slug.toLowerCase())
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Project;
}

export async function getProjectByInviteCode(inviteCode: string): Promise<Project | null> {
  const snapshot = await db
    .collection("groups")
    .where("inviteCode", "==", inviteCode)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Project;
}

export async function listUserProjects(agentId: string): Promise<(ProjectMember & { project: Project })[]> {
  const memberships = await db
    .collection("group_members")
    .where("agentId", "==", agentId)
    .get();

  if (memberships.empty) return [];

  const projectIds = memberships.docs.map((doc) => doc.data().groupId as string);
  const projectDocs = await db.getAll(
    ...projectIds.map((id) => db.collection("groups").doc(id))
  );

  const projects: Record<string, Project> = {};
  for (const doc of projectDocs) {
    if (doc.exists) {
      projects[doc.id] = { id: doc.id, ...doc.data() } as Project;
    }
  }

  return memberships.docs
    .map((doc) => {
      const data = doc.data();
      const project = projects[data.groupId];
      if (!project) return null;
      return {
        id: doc.id,
        groupId: data.groupId,
        agentId: data.agentId,
        role: data.role,
        joinedAt: data.joinedAt,
        project,
      } as ProjectMember & { project: Project };
    })
    .filter((m): m is ProjectMember & { project: Project } => m !== null);
}

export async function joinProject(
  agentId: string,
  inviteCode: string
): Promise<{ project: Project } | { error: string }> {
  const project = await getProjectByInviteCode(inviteCode);
  if (!project) {
    return { error: "Invalid invite code." };
  }

  const existing = await db
    .collection("group_members")
    .where("groupId", "==", project.id)
    .where("agentId", "==", agentId)
    .limit(1)
    .get();

  if (!existing.empty) {
    return { project };
  }

  await db.collection("group_members").add({
    groupId: project.id,
    agentId,
    role: "member",
    joinedAt: new Date().toISOString(),
  });

  return { project };
}

export async function regenerateInviteCode(projectId: string): Promise<string> {
  const newCode = generateInviteCode();
  await db.collection("groups").doc(projectId).update({ inviteCode: newCode });
  return newCode;
}

export async function getMembers(
  projectId: string
): Promise<(ProjectMember & { agent: Agent | null })[]> {
  const snapshot = await db
    .collection("group_members")
    .where("groupId", "==", projectId)
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
    } as ProjectMember & { agent: Agent | null };
  });
}

export async function removeMember(
  projectId: string,
  agentId: string
): Promise<boolean> {
  const snapshot = await db
    .collection("group_members")
    .where("groupId", "==", projectId)
    .where("agentId", "==", agentId)
    .limit(1)
    .get();

  if (snapshot.empty) return false;

  await snapshot.docs[0].ref.delete();
  return true;
}
