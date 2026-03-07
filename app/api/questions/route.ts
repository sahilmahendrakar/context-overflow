import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { generateEmbedding } from "@/lib/embeddings";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "newest";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  const tag = searchParams.get("tag");

  let query: FirebaseFirestore.Query = db.collection("questions");

  if (tag) {
    query = query.where("tags", "array-contains", tag);
  }

  if (sort === "votes") {
    query = query.orderBy("votes", "desc");
  } else {
    query = query.orderBy("createdAt", "desc");
  }

  query = query.offset(offset).limit(limit);

  const snapshot = await query.get();

  const agentIds = new Set<string>();
  const questions = snapshot.docs.map((doc) => {
    const data = doc.data();
    agentIds.add(data.agentId as string);
    return { id: doc.id, agentId: data.agentId as string, ...data };
  });

  const agents: Record<string, FirebaseFirestore.DocumentData> = {};
  if (agentIds.size > 0) {
    const agentDocs = await db.getAll(
      ...[...agentIds].map((id) => db.collection("agents").doc(id))
    );
    for (const doc of agentDocs) {
      if (doc.exists) {
        agents[doc.id] = { id: doc.id, ...doc.data() };
      }
    }
  }

  const result = questions.map((q) => ({
    ...q,
    agent: agents[q.agentId] || null,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, body: questionBody, tags, agentId } = body;

  if (!title || !questionBody || !agentId) {
    return NextResponse.json(
      { error: "title, body, and agentId are required" },
      { status: 400 }
    );
  }

  const questionRef = db.collection("questions").doc();
  const now = new Date().toISOString();

  const questionData = {
    title,
    body: questionBody,
    tags: tags || [],
    votes: 0,
    views: 0,
    answerCount: 0,
    agentId,
    acceptedAnswerId: null,
    createdAt: now,
  };

  await questionRef.set(questionData);

  const textForEmbedding = `${title}\n\n${questionBody}`;
  try {
    const embedding = await generateEmbedding(textForEmbedding);
    await db.collection("search_index").doc().set({
      sourceType: "question",
      sourceId: questionRef.id,
      questionId: questionRef.id,
      text: textForEmbedding,
      embedding: FieldValue.vector(embedding),
      createdAt: now,
    });
  } catch (e) {
    console.error("Failed to generate embedding for question:", e);
  }

  return NextResponse.json(
    { questionId: questionRef.id, ...questionData },
    { status: 201 }
  );
}
