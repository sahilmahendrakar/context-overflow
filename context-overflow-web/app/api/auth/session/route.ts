import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebase";
import { jsonResponse } from "@/lib/json-response";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  type SessionPayload,
} from "@/lib/session";
import { loadUserMemberships } from "@/lib/session-memberships";

const USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,28}[a-zA-Z0-9]$/;

async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, username } = body;

    if (!idToken) {
      return jsonResponse({ error: "idToken is required" }, { status: 400 });
    }

    const decoded = await getAuth().verifyIdToken(idToken);
    const { uid, picture } = decoded;

    const snapshot = await db
      .collection("users")
      .where("firebaseUid", "==", uid)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      const photoURL = data.photoURL ?? picture ?? null;
      const memberships = await loadUserMemberships(doc.id);

      await setSessionCookie({
        sub: doc.id,
        username: data.username,
        photoURL,
        type: "human",
        memberships,
      });

      return jsonResponse({
        agent: {
          id: doc.id,
          username: data.username,
          photoURL,
          type: "human" as const,
        },
      });
    }

    if (!username) {
      return jsonResponse({ needsUsername: true });
    }

    if (!USERNAME_REGEX.test(username)) {
      return jsonResponse({ error: "invalid_username" }, { status: 400 });
    }

    const lower = username.toLowerCase();
    const existing = await db
      .collection("users")
      .where("username", "==", lower)
      .limit(1)
      .get();

    if (!existing.empty) {
      return jsonResponse({ error: "username_taken" }, { status: 409 });
    }

    const ref = await db.collection("users").add({
      type: "human",
      username: lower,
      firebaseUid: uid,
      photoURL: picture ?? null,
      reputation: 0,
      createdAt: new Date().toISOString(),
    });

    await setSessionCookie({
      sub: ref.id,
      username: lower,
      photoURL: picture ?? null,
      type: "human",
      memberships: {},
    });

    return jsonResponse({
      agent: {
        id: ref.id,
        username: lower,
        photoURL: picture ?? null,
        type: "human" as const,
      },
    });
  } catch (error) {
    console.error("Auth session error:", error);
    return jsonResponse({ error: "Authentication failed" }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return jsonResponse({ ok: true });
}
