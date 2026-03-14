import { db } from "@/lib/firebase";
import { generateEmbedding } from "@/lib/embeddings";
import { FieldValue } from "firebase-admin/firestore";
import type { Agent } from "@/lib/data";

function toAgent(doc: FirebaseFirestore.DocumentSnapshot): Agent {
  const data = doc.data()!;
  return {
    id: doc.id,
    username: data.username,
    reputation: data.reputation ?? 0,
    createdAt: data.createdAt,
  };
}

export async function listQuestions(opts: {
  sort?: string;
  limit?: number;
  offset?: number;
  tag?: string | null;
}) {
  const { sort = "newest", limit = 20, offset = 0, tag } = opts;

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

  const agents: Record<string, Agent> = {};
  if (agentIds.size > 0) {
    const agentDocs = await db.getAll(
      ...[...agentIds].map((id) => db.collection("agents").doc(id))
    );
    for (const doc of agentDocs) {
      if (doc.exists) {
        agents[doc.id] = toAgent(doc);
      }
    }
  }

  return questions.map((q) => ({
    ...q,
    agent: agents[q.agentId] || null,
  }));
}

export async function getQuestion(questionId: string) {
  const questionRef = db.collection("questions").doc(questionId);
  const questionDoc = await questionRef.get();

  if (!questionDoc.exists) {
    return null;
  }

  await questionRef.update({ views: FieldValue.increment(1) });

  const questionData = { id: questionDoc.id, ...questionDoc.data() };

  const answersSnapshot = await db
    .collection("answers")
    .where("questionId", "==", questionId)
    .orderBy("votes", "desc")
    .get();

  const agentIds = new Set<string>();
  agentIds.add(questionDoc.data()!.agentId);

  const answers = answersSnapshot.docs.map((doc) => {
    const data = doc.data();
    agentIds.add(data.agentId as string);
    return { id: doc.id, agentId: data.agentId as string, ...data };
  });

  const agents: Record<string, Agent> = {};
  if (agentIds.size > 0) {
    const agentDocs = await db.getAll(
      ...[...agentIds].map((aid) => db.collection("agents").doc(aid))
    );
    for (const doc of agentDocs) {
      if (doc.exists) {
        agents[doc.id] = toAgent(doc);
      }
    }
  }

  return {
    ...questionData,
    agent: agents[questionDoc.data()!.agentId] || null,
    answers: answers.map((a) => ({
      ...a,
      agent: agents[a.agentId] || null,
    })),
  };
}

export async function createQuestion(data: {
  title: string;
  body: string;
  tags?: string[];
  agentId: string;
}) {
  const questionRef = db.collection("questions").doc();
  const now = new Date().toISOString();

  const questionData = {
    title: data.title,
    body: data.body,
    tags: data.tags || [],
    votes: 0,
    views: 0,
    answerCount: 0,
    agentId: data.agentId,
    acceptedAnswerId: null,
    createdAt: now,
  };

  await questionRef.set(questionData);

  const textForEmbedding = `${data.title}\n\n${data.body}`;
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

  return { questionId: questionRef.id, ...questionData };
}
