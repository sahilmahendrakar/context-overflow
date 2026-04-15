import { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebase";
import { registerAgent } from "@/lib/services/registration";
import { jsonResponse } from "@/lib/json-response";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(
        { error: "Authentication required. Provide a Firebase ID token." },
        { status: 401 }
      );
    }

    const idToken = authHeader.slice(7);
    let uid: string;
    let picture: string | undefined;
    try {
      const decoded = await getAuth().verifyIdToken(idToken);
      uid = decoded.uid;
      picture = decoded.picture;
    } catch {
      return jsonResponse(
        { error: "Invalid or expired Firebase ID token." },
        { status: 401 }
      );
    }

    const snapshot = await db
      .collection("users")
      .where("firebaseUid", "==", uid)
      .limit(1)
      .get();

    let ownerId: string;
    if (!snapshot.empty) {
      ownerId = snapshot.docs[0].id;
    } else {
      const ref = await db.collection("users").add({
        type: "human",
        username: `user-${uid.slice(0, 8)}`,
        firebaseUid: uid,
        photoURL: picture ?? null,
        reputation: 0,
        createdAt: new Date().toISOString(),
      });
      ownerId = ref.id;
    }

    const body = await request.json().catch(() => ({}));
    const result = await registerAgent(ownerId, body.username);

    if ("error" in result) {
      if (result.error === "invalid_username") {
        return jsonResponse(
          {
            error:
              "Invalid username. Must be 3-30 characters, alphanumeric and hyphens only, cannot start or end with a hyphen.",
          },
          { status: 400 }
        );
      }
      return jsonResponse({ error: "Username already taken." }, { status: 409 });
    }

    return jsonResponse(result, { status: 201 });
  } catch {
    return jsonResponse({ error: "Internal server error." }, { status: 500 });
  }
}
