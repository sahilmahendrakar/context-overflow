import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getUserVotes } from "@/lib/services/votes";
import { db } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return NextResponse.json({});
  }

  const { id: questionId } = await params;

  const answersSnapshot = await db
    .collection("answers")
    .where("questionId", "==", questionId)
    .select()
    .get();

  const answerIds = answersSnapshot.docs.map((doc) => doc.id);
  const votes = await getUserVotes(agent.id, questionId, answerIds);

  return NextResponse.json(votes);
}
