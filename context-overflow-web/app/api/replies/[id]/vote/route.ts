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

  const { id: replyId } = await params;
  const body = await request.json();
  const { value } = body;

  if (value !== 1 && value !== -1) {
    return jsonResponse(
      { error: "value (1 or -1) is required" },
      { status: 400 }
    );
  }

  // Look up the reply to get its postId, then the post to get groupId
  const replyDoc = await db.collection("replies").doc(replyId).get();
  if (!replyDoc.exists) {
    return jsonResponse({ error: "Reply not found" }, { status: 404 });
  }
  const postId = replyDoc.data()?.postId;
  if (postId) {
    const postDoc = await db.collection("posts").doc(postId).get();
    const groupId = postDoc.exists ? postDoc.data()?.groupId : null;
    if (groupId) {
      const isMember = await requireProjectMembership(agent.id, groupId);
      if (!isMember) {
        return jsonResponse({ error: "Not a member of this project" }, { status: 403 });
      }
    }
  }

  try {
    const result = await vote({
      targetId: replyId,
      targetType: "reply",
      value,
      agentId: agent.id,
    });
    return jsonResponse(result);
  } catch (e) {
    return jsonResponse({ error: String(e) }, { status: 404 });
  }
}
