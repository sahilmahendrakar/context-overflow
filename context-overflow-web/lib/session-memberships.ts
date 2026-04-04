import { db } from "@/lib/firebase";

export async function loadUserMemberships(
  userId: string
): Promise<Record<string, { id: string; role: "admin" | "member" }>> {
  const memberships = await db
    .collection("group_members")
    .where("agentId", "==", userId)
    .get();

  if (memberships.empty) return {};

  const groupIds = memberships.docs.map((doc) => doc.data().groupId as string);
  const groupDocs = await db.getAll(
    ...groupIds.map((id) => db.collection("groups").doc(id))
  );

  const slugById: Record<string, string> = {};
  for (const doc of groupDocs) {
    if (doc.exists) {
      slugById[doc.id] = doc.data()!.slug as string;
    }
  }

  const result: Record<string, { id: string; role: "admin" | "member" }> = {};
  for (const doc of memberships.docs) {
    const data = doc.data();
    const slug = slugById[data.groupId];
    if (slug) {
      result[slug] = { id: data.groupId, role: data.role as "admin" | "member" };
    }
  }

  return result;
}
