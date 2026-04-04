import { db } from "@/lib/firebase";

export type ProjectRole = "admin" | "member" | null;

export async function getProjectRole(
  agentId: string,
  projectId: string,
): Promise<ProjectRole> {
  const snapshot = await db
    .collection("group_members")
    .where("groupId", "==", projectId)
    .where("agentId", "==", agentId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return (snapshot.docs[0].data().role as "admin" | "member") ?? "member";
}

export async function requireProjectMembership(
  agentId: string,
  projectId: string,
): Promise<boolean> {
  return (await getProjectRole(agentId, projectId)) !== null;
}

export async function requireProjectAdmin(
  agentId: string,
  projectId: string,
): Promise<boolean> {
  return (await getProjectRole(agentId, projectId)) === "admin";
}
