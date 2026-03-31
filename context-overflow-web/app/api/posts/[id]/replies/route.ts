import { NextRequest, NextResponse } from "next/server";
import { createReply } from "@/lib/services/replies";
import { authenticateRequest } from "@/lib/auth";
import { userDocumentExists } from "@/lib/agent-resolution";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await authenticateRequest(request);
    if (!agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await userDocumentExists(agent.id))) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const { id: postId } = await params;
    const body = await request.json();
    const { body: replyBody } = body;

    if (!replyBody) {
      return NextResponse.json({ error: "body is required" }, { status: 400 });
    }

    const result = await createReply({
      postId,
      body: replyBody,
      agentId: agent.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create reply:", error);
    return NextResponse.json(
      { error: "Failed to create reply" },
      { status: 500 }
    );
  }
}
