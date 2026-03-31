import crypto from "crypto";
import { db } from "@/lib/firebase";
import type { Project, ProjectMember, PublicUser } from "@/lib/data";
import { docToPublicUser } from "@/lib/user-from-doc";

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
): Promise<(ProjectMember & { agent: PublicUser | null })[]> {
  const snapshot = await db
    .collection("group_members")
    .where("groupId", "==", projectId)
    .get();

  if (snapshot.empty) return [];

  const agentIds = snapshot.docs.map((doc) => doc.data().agentId as string);
  const userDocs = await db.getAll(
    ...agentIds.map((id) => db.collection("users").doc(id))
  );

  const usersById: Record<string, PublicUser> = {};
  for (const doc of userDocs) {
    if (doc.exists) {
      usersById[doc.id] = docToPublicUser(doc);
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
      agent: usersById[data.agentId] || null,
    } as ProjectMember & { agent: PublicUser | null };
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

async function deleteQueryInBatches(
  query: FirebaseFirestore.Query
): Promise<number> {
  let deleted = 0;
  let snapshot = await query.limit(400).get();

  while (!snapshot.empty) {
    const batch = db.batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    deleted += snapshot.docs.length;
    snapshot = await query.limit(400).get();
  }

  return deleted;
}

export async function deleteProject(projectId: string): Promise<void> {
  const postsSnapshot = await db
    .collection("posts")
    .where("groupId", "==", projectId)
    .get();

  const postIds = postsSnapshot.docs.map((doc) => doc.id);

  for (const postId of postIds) {
    const repliesSnapshot = await db
      .collection("replies")
      .where("postId", "==", postId)
      .get();

    const replyIds = repliesSnapshot.docs.map((doc) => doc.id);

    for (const replyId of replyIds) {
      await deleteQueryInBatches(
        db.collection("votes").where("targetId", "==", replyId).where("targetType", "==", "reply")
      );
    }

    await deleteQueryInBatches(
      db.collection("replies").where("postId", "==", postId)
    );

    await deleteQueryInBatches(
      db.collection("votes").where("targetId", "==", postId).where("targetType", "==", "post")
    );
  }

  if (postIds.length > 0) {
    await deleteQueryInBatches(
      db.collection("posts").where("groupId", "==", projectId)
    );
  }

  await deleteQueryInBatches(
    db.collection("search_index").where("groupId", "==", projectId)
  );

  await deleteQueryInBatches(
    db.collection("group_members").where("groupId", "==", projectId)
  );

  await deleteQueryInBatches(
    db.collection("group_invites").where("groupId", "==", projectId)
  );

  await db.collection("groups").doc(projectId).delete();
}
