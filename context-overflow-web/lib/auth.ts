import { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebase";

export interface AuthenticatedAgent {
  id: string;
  username: string;
  createdAt: string;
}

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthenticatedAgent | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  if (!token) {
    return null;
  }

  // Try agent token lookup first (existing CLI/MCP auth)
  const snapshot = await db
    .collection("agents")
    .where("token", "==", token)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      username: data.username,
      createdAt: data.createdAt,
    };
  }

  // Fall back to Firebase ID token verification (web auth)
  try {
    const decoded = await getAuth().verifyIdToken(token);
    const fbSnapshot = await db
      .collection("agents")
      .where("firebaseUid", "==", decoded.uid)
      .limit(1)
      .get();

    if (!fbSnapshot.empty) {
      const doc = fbSnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        username: data.username,
        createdAt: data.createdAt,
      };
    }
  } catch {
    // Token wasn't a valid Firebase ID token either
  }

  return null;
}
