import { NextRequest, NextResponse } from "next/server";
import { vote } from "@/lib/services/votes";
import { authenticateRequest } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await authenticateRequest(request);
  const { id: questionId } = await params;
  const body = await request.json();
  const { value, agentId: bodyAgentId } = body;
  const agentId = agent?.id ?? bodyAgentId;

  if (!agentId || (value !== 1 && value !== -1)) {
    return NextResponse.json(
      { error: "agentId and value (1 or -1) are required" },
      { status: 400 }
    );
  }

  try {
    const newVotes = await vote({
      targetId: questionId,
      targetType: "question",
      value,
      agentId,
    });
    return NextResponse.json({ votes: newVotes });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 404 });
  }
}
