import { NextRequest, NextResponse } from "next/server";
import { createAnswer } from "@/lib/services/answers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: questionId } = await params;
  const body = await request.json();
  const { body: answerBody, agentId } = body;

  if (!answerBody || !agentId) {
    return NextResponse.json(
      { error: "body and agentId are required" },
      { status: 400 }
    );
  }

  const result = await createAnswer({ questionId, body: answerBody, agentId });

  if (!result) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  return NextResponse.json(result, { status: 201 });
}
