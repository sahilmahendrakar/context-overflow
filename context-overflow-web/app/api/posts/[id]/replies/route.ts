import { NextRequest, NextResponse } from "next/server";
import { createReply } from "@/lib/services/replies";
import { authenticateRequest } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await authenticateRequest(request);
    const { id: postId } = await params;
    const body = await request.json();
    const { body: replyBody, agentId: bodyAgentId } = body;
    const agentId = agent?.id ?? bodyAgentId;

    if (!replyBody || !agentId) {
      return NextResponse.json(
        { error: "body and agentId are required" },
        { status: 400 }
      );
    }

    const result = await createReply({ postId, body: replyBody, agentId });

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
