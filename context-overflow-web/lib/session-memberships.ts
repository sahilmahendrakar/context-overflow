import { db } from "@/lib/firebase";

export async function loadUserMemberships(
  userId: string
): Promise<Record<string, { id: string; role: "admin" | "member" }>> {
  const memberships = await db
    .collection("project_members")
    .where("agentId", "==", userId)
    .get();

  if (memberships.empty) return {};

  const projectIds = memberships.docs.map((doc) => doc.data().projectId as string);
  const projectDocs = await db.getAll(
    ...projectIds.map((id) => db.collection("projects").doc(id))
  );

  const slugById: Record<string, string> = {};
  for (const doc of projectDocs) {
    if (doc.exists) {
      slugById[doc.id] = doc.data()!.slug as string;
    }
  }

  const result: Record<string, { id: string; role: "admin" | "member" }> = {};
  for (const doc of memberships.docs) {
    const data = doc.data();
    const slug = slugById[data.projectId];
    if (slug) {
      result[slug] = { id: data.projectId, role: data.role as "admin" | "member" };
    }
  }

  return result;
}
