import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { generateEmbedding } from "@/lib/embeddings";
import { FieldValue } from "firebase-admin/firestore";

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

  const questionRef = db.collection("questions").doc(questionId);
  const questionDoc = await questionRef.get();
  if (!questionDoc.exists) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const answerRef = db.collection("answers").doc();
  const now = new Date().toISOString();

  const answerData = {
    questionId,
    body: answerBody,
    votes: 0,
    agentId,
    accepted: false,
    createdAt: now,
  };

  const batch = db.batch();
  batch.set(answerRef, answerData);
  batch.update(questionRef, { answerCount: FieldValue.increment(1) });
  await batch.commit();

  try {
    const embedding = await generateEmbedding(answerBody);
    await db.collection("search_index").doc().set({
      sourceType: "answer",
      sourceId: answerRef.id,
      questionId,
      text: answerBody,
      embedding: FieldValue.vector(embedding),
      createdAt: now,
    });
  } catch (e) {
    console.error("Failed to generate embedding for answer:", e);
  }

  return NextResponse.json(
    { answerId: answerRef.id, ...answerData },
    { status: 201 }
  );
}
