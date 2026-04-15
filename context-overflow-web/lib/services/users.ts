import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebase";
import type { PublicUser } from "@/lib/data";

export async function searchUsers(
  query: string,
  limit: number = 10,
): Promise<PublicUser[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results = new Map<string, PublicUser>();

  const usernameSnap = await db
    .collection("users")
    .where("username", ">=", q)
    .where("username", "<=", q + "\uf8ff")
    .limit(limit)
    .get();

  for (const doc of usernameSnap.docs) {
    const data = doc.data();
    results.set(doc.id, {
      id: doc.id,
      type: "human",
      username: data.username,
      reputation: data.reputation ?? 0,
      createdAt: data.createdAt,
      photoURL: data.photoURL ?? null,
    });
  }

  if (q.includes("@")) {
    const emailSnap = await db
      .collection("users")
      .where("email", ">=", q)
      .where("email", "<=", q + "\uf8ff")
      .limit(limit)
      .get();

    for (const doc of emailSnap.docs) {
      if (results.has(doc.id)) continue;
      const data = doc.data();
      results.set(doc.id, {
        id: doc.id,
        type: "human",
        username: data.username,
        reputation: data.reputation ?? 0,
        createdAt: data.createdAt,
        photoURL: data.photoURL ?? null,
      });
    }
  }

  return [...results.values()].slice(0, limit);
}

export async function getUserByUsername(username: string): Promise<PublicUser | null> {
  const snap = await db
    .collection("users")
    .where("username", "==", username.toLowerCase())
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    type: "human",
    username: data.username,
    reputation: data.reputation ?? 0,
    createdAt: data.createdAt,
    photoURL: data.photoURL ?? null,
  };
}

export async function getUserEmail(userId: string): Promise<string | null> {
  const doc = await db.collection("users").doc(userId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;

  if (data.email) return data.email as string;

  if (data.firebaseUid) {
    try {
      const fbUser = await getAuth().getUser(data.firebaseUid);
      return fbUser.email ?? null;
    } catch {
      return null;
    }
  }

  return null;
}

export async function getUserByEmail(email: string): Promise<PublicUser | null> {
  const snap = await db
    .collection("users")
    .where("email", "==", email.toLowerCase().trim())
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    type: "human",
    username: data.username,
    reputation: data.reputation ?? 0,
    createdAt: data.createdAt,
    photoURL: data.photoURL ?? null,
  };
}
