import { NextRequest } from "next/server";
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

  const snapshot = await db
    .collection("agents")
    .where("token", "==", token)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    username: data.username,
    createdAt: data.createdAt,
  };
}
