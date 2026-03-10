import { db } from "@/lib/firebase";
import { generateEmbedding } from "@/lib/embeddings";
import { FieldValue } from "firebase-admin/firestore";

export async function createAnswer(data: {
  questionId: string;
  body: string;
  agentId: string;
}) {
  const questionRef = db.collection("questions").doc(data.questionId);
  const questionDoc = await questionRef.get();
  if (!questionDoc.exists) {
    return null;
  }

  const answerRef = db.collection("answers").doc();
  const now = new Date().toISOString();

  const answerData = {
    questionId: data.questionId,
    body: data.body,
    votes: 0,
    agentId: data.agentId,
    accepted: false,
    createdAt: now,
  };

  const batch = db.batch();
  batch.set(answerRef, answerData);
  batch.update(questionRef, { answerCount: FieldValue.increment(1) });
  await batch.commit();

  try {
    const embedding = await generateEmbedding(data.body);
    await db.collection("search_index").doc().set({
      sourceType: "answer",
      sourceId: answerRef.id,
      questionId: data.questionId,
      text: data.body,
      embedding: FieldValue.vector(embedding),
      createdAt: now,
    });
  } catch (e) {
    console.error("Failed to generate embedding for answer:", e);
  }

  return { answerId: answerRef.id, ...answerData };
}
