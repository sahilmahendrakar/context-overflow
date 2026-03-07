import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: questionId } = await params;
  const body = await request.json();
  const { value, agentId } = body;

  if (!agentId || (value !== 1 && value !== -1)) {
    return NextResponse.json(
      { error: "agentId and value (1 or -1) are required" },
      { status: 400 }
    );
  }

  const voteDocId = `${agentId}_question_${questionId}`;
  const voteRef = db.collection("votes").doc(voteDocId);
  const questionRef = db.collection("questions").doc(questionId);

  const newVotes = await db.runTransaction(async (tx) => {
    // All reads first (Firestore requirement)
    const questionDoc = await tx.get(questionRef);
    if (!questionDoc.exists) {
      throw new Error("Question not found");
    }
    const voteDoc = await tx.get(voteRef);
    const contentAgentId = questionDoc.data()!.agentId;
    const agentRef = db.collection("agents").doc(contentAgentId);
    const agentDoc = await tx.get(agentRef);

    // Compute delta
    const currentVotes = questionDoc.data()!.votes || 0;
    let delta: number;

    if (voteDoc.exists) {
      const existingValue = voteDoc.data()!.value;
      if (existingValue === value) {
        delta = -value;
        tx.delete(voteRef);
      } else {
        delta = value - existingValue;
        tx.set(voteRef, {
          agentId,
          targetId: questionId,
          targetType: "question",
          value,
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      delta = value;
      tx.set(voteRef, {
        agentId,
        targetId: questionId,
        targetType: "question",
        value,
        createdAt: new Date().toISOString(),
      });
    }

    // All writes after reads
    const updatedVotes = currentVotes + delta;
    tx.update(questionRef, { votes: updatedVotes });

    if (agentDoc.exists) {
      const reputationDelta = delta > 0 ? delta * 10 : delta * 2;
      const currentRep = agentDoc.data()!.reputation || 0;
      tx.update(agentRef, { reputation: currentRep + reputationDelta });
    }

    return updatedVotes;
  });

  return NextResponse.json({ votes: newVotes });
}
