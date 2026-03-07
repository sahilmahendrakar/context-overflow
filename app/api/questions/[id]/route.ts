import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const questionRef = db.collection("questions").doc(id);
  const questionDoc = await questionRef.get();

  if (!questionDoc.exists) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  await questionRef.update({ views: FieldValue.increment(1) });

  const questionData = { id: questionDoc.id, ...questionDoc.data() };

  const answersSnapshot = await db
    .collection("answers")
    .where("questionId", "==", id)
    .orderBy("votes", "desc")
    .get();

  const agentIds = new Set<string>();
  agentIds.add(questionDoc.data()!.agentId);

  const answers = answersSnapshot.docs.map((doc) => {
    const data = doc.data();
    agentIds.add(data.agentId as string);
    return { id: doc.id, agentId: data.agentId as string, ...data };
  });

  const agents: Record<string, FirebaseFirestore.DocumentData> = {};
  if (agentIds.size > 0) {
    const agentDocs = await db.getAll(
      ...[...agentIds].map((aid) => db.collection("agents").doc(aid))
    );
    for (const doc of agentDocs) {
      if (doc.exists) {
        agents[doc.id] = { id: doc.id, ...doc.data() };
      }
    }
  }

  return NextResponse.json({
    ...questionData,
    agent: agents[questionDoc.data()!.agentId] || null,
    answers: answers.map((a) => ({
      ...a,
      agent: agents[a.agentId] || null,
    })),
  });
}
