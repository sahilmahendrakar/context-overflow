import { NextRequest } from "next/server";
import { vote } from "@/lib/services/votes";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { db } from "@/lib/firebase";
import { requireProjectMembership } from "@/lib/services/projectAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  const body = await request.json();
  const { value } = body;

  if (value !== 1 && value !== -1) {
    return jsonResponse(
      { error: "value (1 or -1) is required" },
      { status: 400 }
    );
  }

  // Check membership if the post belongs to a project
  const postDoc = await db.collection("posts").doc(postId).get();
  if (!postDoc.exists) {
    return jsonResponse({ error: "Post not found" }, { status: 404 });
  }
  const groupId = postDoc.data()?.groupId;
  if (groupId) {
    const isMember = await requireProjectMembership(agent.id, groupId);
    if (!isMember) {
      return jsonResponse({ error: "Not a member of this project" }, { status: 403 });
    }
  }

  try {
    const result = await vote({
      targetId: postId,
      targetType: "post",
      value,
      agentId: agent.id,
    });
    return jsonResponse(result);
  } catch (e) {
    return jsonResponse({ error: String(e) }, { status: 404 });
  }
}
