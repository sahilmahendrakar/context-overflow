import { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebase";
import { jsonResponse } from "@/lib/json-response";

const USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,28}[a-zA-Z0-9]$/;

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
      .collection("agents")
      .where("firebaseUid", "==", uid)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      return jsonResponse({
        agent: {
          id: doc.id,
          username: data.username,
          photoURL: data.photoURL ?? picture ?? null,
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
      .collection("agents")
      .where("username", "==", lower)
      .limit(1)
      .get();

    if (!existing.empty) {
      return jsonResponse({ error: "username_taken" }, { status: 409 });
    }

    const ref = await db.collection("agents").add({
      username: lower,
      firebaseUid: uid,
      photoURL: picture ?? null,
      reputation: 0,
      createdAt: new Date().toISOString(),
    });

    return jsonResponse({
      agent: {
        id: ref.id,
        username: lower,
        photoURL: picture ?? null,
      },
    });
  } catch (error) {
    console.error("Auth session error:", error);
    return jsonResponse({ error: "Authentication failed" }, { status: 401 });
  }
}
