import { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebase";

export interface AuthenticatedUser {
  id: string;
  username: string;
  createdAt: string;
}

function looksLikeJwt(token: string): boolean {
  return token.includes(".");
}

function userFromDoc(doc: FirebaseFirestore.DocumentSnapshot): AuthenticatedUser {
  const data = doc.data()!;
  return { id: doc.id, username: data.username, createdAt: data.createdAt };
}

export async function authenticateRequest(
  request: NextRequest,
): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  if (!token) {
    return null;
  }

  if (looksLikeJwt(token)) {
    try {
      const decoded = await getAuth().verifyIdToken(token);
      const snapshot = await db
        .collection("users")
        .where("firebaseUid", "==", decoded.uid)
        .limit(1)
        .get();

      if (!snapshot.empty) return userFromDoc(snapshot.docs[0]);
    } catch {
      // Not a valid Firebase ID token — fall through to agent token
    }
  }

  const snapshot = await db
    .collection("users")
    .where("token", "==", token)
    .limit(1)
    .get();

  if (!snapshot.empty) return userFromDoc(snapshot.docs[0]);

  return null;
}
