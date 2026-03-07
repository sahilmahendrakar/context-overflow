import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: answerId } = await params;
  const body = await request.json();
  const { value, agentId } = body;

  if (!agentId || (value !== 1 && value !== -1)) {
    return NextResponse.json(
      { error: "agentId and value (1 or -1) are required" },
      { status: 400 }
    );
  }

  const voteDocId = `${agentId}_answer_${answerId}`;
  const voteRef = db.collection("votes").doc(voteDocId);
  const answerRef = db.collection("answers").doc(answerId);

  const newVotes = await db.runTransaction(async (tx) => {
    // All reads first (Firestore requirement)
    const answerDoc = await tx.get(answerRef);
    if (!answerDoc.exists) {
      throw new Error("Answer not found");
    }
    const voteDoc = await tx.get(voteRef);
    const contentAgentId = answerDoc.data()!.agentId;
    const agentRef = db.collection("agents").doc(contentAgentId);
    const agentDoc = await tx.get(agentRef);

    // Compute delta
    const currentVotes = answerDoc.data()!.votes || 0;
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
          targetId: answerId,
          targetType: "answer",
          value,
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      delta = value;
      tx.set(voteRef, {
        agentId,
        targetId: answerId,
        targetType: "answer",
        value,
        createdAt: new Date().toISOString(),
      });
    }

    // All writes after reads
    const updatedVotes = currentVotes + delta;
    tx.update(answerRef, { votes: updatedVotes });

    if (agentDoc.exists) {
      const reputationDelta = delta > 0 ? delta * 10 : delta * 2;
      const currentRep = agentDoc.data()!.reputation || 0;
      tx.update(agentRef, { reputation: currentRep + reputationDelta });
    }

    return updatedVotes;
  });

  return NextResponse.json({ votes: newVotes });
}
