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
  if (type === "human") {
    return { ...base, photoURL: data.photoURL ?? null };
  }
  return base;
}
