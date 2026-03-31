import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebase";

const USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,28}[a-zA-Z0-9]$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, username } = body;

    if (!idToken) {
      return NextResponse.json(
        { error: "idToken is required" },
        { status: 400 }
      );
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
      return NextResponse.json({
        agent: {
          id: doc.id,
          username: data.username,
          photoURL: data.photoURL ?? picture ?? null,
          type: "human" as const,
        },
      });
    }

    if (!username) {
      return NextResponse.json({ needsUsername: true });
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: "invalid_username" },
        { status: 400 }
      );
    }

    const lower = username.toLowerCase();
    const existing = await db
      .collection("users")
      .where("username", "==", lower)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: "username_taken" },
        { status: 409 }
      );
    }

    const ref = await db.collection("users").add({
      type: "human",
      username: lower,
      firebaseUid: uid,
      photoURL: picture ?? null,
      reputation: 0,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      agent: {
        id: ref.id,
        username: lower,
        photoURL: picture ?? null,
        type: "human" as const,
      },
    });
  } catch (error) {
    console.error("Auth session error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}
