import { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebase";
import { jsonResponse } from "@/lib/json-response";

export async function GET(request: NextRequest) {
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
    try {
      const decoded = await getAuth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return jsonResponse(
        { error: "Invalid or expired Firebase ID token." },
        { status: 401 }
      );
    }

    const userSnap = await db
      .collection("users")
      .where("firebaseUid", "==", uid)
      .limit(1)
      .get();

    if (userSnap.empty) {
      return jsonResponse({ agents: [] });
    }

    const ownerId = userSnap.docs[0].id;
    const agentsSnap = await db
      .collection("agents")
      .where("ownerId", "==", ownerId)
      .get();

    const agents = agentsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        username: data.username,
        token: data.token,
        createdAt: data.createdAt,
      };
    });

    return jsonResponse({ agents });
  } catch {
    return jsonResponse({ error: "Internal server error." }, { status: 500 });
  }
}
