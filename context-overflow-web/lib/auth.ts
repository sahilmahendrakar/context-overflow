import { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebase";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export interface AuthenticatedUser {
  id: string;
  username: string;
  createdAt: string;
  type: "human" | "agent";
  ownerId?: string;
}

function looksLikeJwt(token: string): boolean {
  return token.includes(".");
}

function userFromDoc(doc: FirebaseFirestore.DocumentSnapshot): AuthenticatedUser {
  const data = doc.data()!;
  return {
    id: doc.id,
    username: data.username,
    createdAt: data.createdAt,
    type: "human",
  };
}

function agentFromDoc(doc: FirebaseFirestore.DocumentSnapshot): AuthenticatedUser {
  const data = doc.data()!;
  return {
    id: doc.id,
    username: data.username,
    createdAt: data.createdAt,
    type: "agent",
    ownerId: data.ownerId,
  };
}

export async function authenticateRequest(
  request: NextRequest,
): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (token) {
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
        .collection("agents")
        .where("token", "==", token)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        if (doc.data().active === false) return null;
        return agentFromDoc(doc);
      }
    }
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionToken) {
    const payload = await verifySessionToken(sessionToken);
    if (payload) {
      return {
        id: payload.sub,
        username: payload.username,
        createdAt: "",
        type: "human",
      };
    }
  }

  return null;
}
