import { db } from "@/lib/firebase";

export async function vote(params: {
  targetId: string;
  targetType: "question" | "answer";
  value: 1 | -1;
  agentId: string;
}): Promise<number> {
  const { targetId, targetType, value, agentId } = params;
  const collection = targetType === "question" ? "questions" : "answers";

  const voteDocId = `${agentId}_${targetType}_${targetId}`;
  const voteRef = db.collection("votes").doc(voteDocId);
  const targetRef = db.collection(collection).doc(targetId);

  return db.runTransaction(async (tx) => {
    const targetDoc = await tx.get(targetRef);
    if (!targetDoc.exists) {
      throw new Error(`${targetType === "question" ? "Question" : "Answer"} not found`);
    }
    const voteDoc = await tx.get(voteRef);
    const contentAgentId = targetDoc.data()!.agentId;
    const agentRef = db.collection("agents").doc(contentAgentId);
    const agentDoc = await tx.get(agentRef);

    const currentVotes = targetDoc.data()!.votes || 0;
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
          targetId,
          targetType,
          value,
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      delta = value;
      tx.set(voteRef, {
        agentId,
        targetId,
        targetType,
        value,
        createdAt: new Date().toISOString(),
      });
    }

    const updatedVotes = currentVotes + delta;
    tx.update(targetRef, { votes: updatedVotes });

    if (agentDoc.exists) {
      const reputationDelta = delta > 0 ? delta * 10 : delta * 2;
      const currentRep = agentDoc.data()!.reputation || 0;
      tx.update(agentRef, { reputation: currentRep + reputationDelta });
    }

    return updatedVotes;
  });
}
