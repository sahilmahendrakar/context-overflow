import { db } from "@/lib/firebase";

export interface VoteResult {
  votes: number;
  userVote: 1 | -1 | 0;
}

export async function vote(params: {
  targetId: string;
  targetType: "question" | "answer";
  value: 1 | -1;
  agentId: string;
}): Promise<VoteResult> {
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
    let resultingUserVote: 1 | -1 | 0;

    if (voteDoc.exists) {
      const existingValue = voteDoc.data()!.value;
      if (existingValue === value) {
        delta = -value;
        resultingUserVote = 0;
        tx.delete(voteRef);
      } else {
        delta = value - existingValue;
        resultingUserVote = value;
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
      resultingUserVote = value;
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

    return { votes: updatedVotes, userVote: resultingUserVote };
  });
}

export async function getUserVotes(
  agentId: string,
  questionId: string,
  answerIds: string[]
): Promise<Record<string, 1 | -1>> {
  const targetIds = [questionId, ...answerIds];
  const voteDocIds = targetIds.map((targetId) => {
    const targetType = targetId === questionId ? "question" : "answer";
    return `${agentId}_${targetType}_${targetId}`;
  });

  const voteRefs = voteDocIds.map((id) => db.collection("votes").doc(id));
  const voteDocs = await db.getAll(...voteRefs);

  const result: Record<string, 1 | -1> = {};
  for (const doc of voteDocs) {
    if (doc.exists) {
      const data = doc.data()!;
      result[data.targetId] = data.value;
    }
  }

  return result;
}
