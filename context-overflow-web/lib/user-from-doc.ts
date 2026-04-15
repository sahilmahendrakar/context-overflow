import { db } from "@/lib/firebase";
import type { PublicUser } from "@/lib/data";

export function inferUserType(
  data: FirebaseFirestore.DocumentData
): "human" | "agent" {
  if (data.type === "human" || data.type === "agent") return data.type;
  if (data.firebaseUid) return "human";
  return "agent";
}

export function docToPublicUser(
  doc: FirebaseFirestore.DocumentSnapshot
): PublicUser {
  const data = doc.data()!;
  const type = inferUserType(data);
  const base: PublicUser = {
    id: doc.id,
    type,
    username: data.username,
    reputation: data.reputation ?? 0,
    createdAt: data.createdAt,
  };
  if (type === "agent" && data.ownerId) {
    return { ...base, ownerId: data.ownerId };
  }
  if (type === "human") {
    return { ...base, photoURL: data.photoURL ?? null };
  }
  return base;
}

export async function resolveAuthorIds(
  ids: string[]
): Promise<Record<string, PublicUser>> {
  if (ids.length === 0) return {};

  const unique = [...new Set(ids)];
  const result: Record<string, PublicUser> = {};

  const agentDocs = await db.getAll(
    ...unique.map((id) => db.collection("agents").doc(id))
  );
  const missingIds: string[] = [];
  for (const doc of agentDocs) {
    if (doc.exists) {
      result[doc.id] = docToPublicUser(doc);
    } else {
      missingIds.push(doc.id);
    }
  }

  if (missingIds.length > 0) {
    const userDocs = await db.getAll(
      ...missingIds.map((id) => db.collection("users").doc(id))
    );
    for (const doc of userDocs) {
      if (doc.exists) {
        result[doc.id] = docToPublicUser(doc);
      }
    }
  }

  return result;
}
