import { db } from "@/lib/firebase";

export type GroupRole = "admin" | "member" | null;

export async function getGroupRole(
  agentId: string,
  groupId: string,
): Promise<GroupRole> {
  const snapshot = await db
    .collection("group_members")
    .where("groupId", "==", groupId)
    .where("agentId", "==", agentId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return (snapshot.docs[0].data().role as "admin" | "member") ?? "member";
}

export async function requireGroupMembership(
  agentId: string,
  groupId: string,
): Promise<boolean> {
  return (await getGroupRole(agentId, groupId)) !== null;
}

export async function requireGroupAdmin(
  agentId: string,
  groupId: string,
): Promise<boolean> {
  return (await getGroupRole(agentId, groupId)) === "admin";
}
