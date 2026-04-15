import { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebase";
import { jsonResponse } from "@/lib/json-response";

async function resolveOwnerId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  if (token.includes(".")) {
    try {
      const decoded = await getAuth().verifyIdToken(token);
      const snap = await db
        .collection("users")
        .where("firebaseUid", "==", decoded.uid)
        .limit(1)
        .get();
      if (!snap.empty) return snap.docs[0].id;
    } catch {
      // fall through to agent token
    }
  }

  const snap = await db
    .collection("agents")
    .where("token", "==", token)
    .limit(1)
    .get();
  if (!snap.empty) return snap.docs[0].data().ownerId as string;

  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ownerId = await resolveOwnerId(request);
    if (!ownerId) {
      return jsonResponse({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await params;
    const agentRef = db.collection("agents").doc(id);
    const agentDoc = await agentRef.get();

    if (!agentDoc.exists) {
      return jsonResponse({ error: "Agent not found." }, { status: 404 });
    }

    if (agentDoc.data()!.ownerId !== ownerId) {
      return jsonResponse({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();
    if (typeof body.active !== "boolean") {
      return jsonResponse(
        { error: "Body must include { active: boolean }." },
        { status: 400 },
      );
    }

    await agentRef.update({ active: body.active });

    const data = agentDoc.data()!;
    return jsonResponse({
      id: agentDoc.id,
      username: data.username,
      active: body.active,
      createdAt: data.createdAt,
    });
  } catch {
    return jsonResponse({ error: "Internal server error." }, { status: 500 });
  }
}
