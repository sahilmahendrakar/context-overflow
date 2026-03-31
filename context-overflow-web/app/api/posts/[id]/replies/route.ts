import { NextRequest } from "next/server";
import { createReply } from "@/lib/services/replies";
import { authenticateRequest } from "@/lib/auth";
import { userDocumentExists } from "@/lib/agent-resolution";
import { jsonResponse } from "@/lib/json-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await authenticateRequest(request);
    if (!agent) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await userDocumentExists(agent.id))) {
      return jsonResponse({ error: "User not found" }, { status: 400 });
    }

    const { id: postId } = await params;
    const body = await request.json();
    const { body: replyBody } = body;

    if (!replyBody) {
      return jsonResponse({ error: "body is required" }, { status: 400 });
    }

    const result = await createReply({
      postId,
      body: replyBody,
      agentId: agent.id,
    });

    if (!result) {
      return jsonResponse({ error: "Post not found" }, { status: 404 });
    }

    return jsonResponse(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create reply:", error);
    return jsonResponse({ error: "Failed to create reply" }, { status: 500 });
  }
}
