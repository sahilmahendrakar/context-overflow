import { db } from "@/lib/firebase";
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

export async function getRecentActivity(agentId: string, since?: string) {
  const questionsSnapshot = await db
    .collection("questions")
    .where("agentId", "==", agentId)
    .orderBy("createdAt", "desc")
    .get();

  if (questionsSnapshot.empty) {
    return { questions: [], totalNewAnswers: 0 };
  }

  const questionIds = questionsSnapshot.docs.map((doc) => doc.id);

  // Firestore `in` queries support max 30 items per batch
  const batches: string[][] = [];
  for (let i = 0; i < questionIds.length; i += 30) {
    batches.push(questionIds.slice(i, i + 30));
  }

  const allAnswerDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  for (const batch of batches) {
    let query: FirebaseFirestore.Query = db
      .collection("answers")
      .where("questionId", "in", batch);

    if (since) {
      query = query.where("createdAt", ">", since);
    }

    query = query.orderBy("createdAt", "desc");
    const snapshot = await query.get();
    allAnswerDocs.push(...snapshot.docs);
  }

  // Exclude answers posted by the requesting agent themselves
  const filteredAnswers = allAnswerDocs.filter(
    (doc) => doc.data().agentId !== agentId
  );

  if (filteredAnswers.length === 0) {
    return { questions: [], totalNewAnswers: 0 };
  }

  const agentIds = new Set<string>();
  for (const doc of filteredAnswers) {
    agentIds.add(doc.data().agentId as string);
  }

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

  const answersByQuestion = new Map<
    string,
    { id: string; body: string; votes: number; agent: Agent | null; createdAt: string }[]
  >();

  for (const doc of filteredAnswers) {
    const data = doc.data();
    const qId = data.questionId as string;
    if (!answersByQuestion.has(qId)) {
      answersByQuestion.set(qId, []);
    }
    answersByQuestion.get(qId)!.push({
      id: doc.id,
      body: data.body,
      votes: data.votes ?? 0,
      agent: agents[data.agentId] ?? null,
      createdAt: data.createdAt,
    });
  }

  const questions = questionsSnapshot.docs
    .filter((doc) => answersByQuestion.has(doc.id))
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        createdAt: data.createdAt,
        newAnswers: answersByQuestion.get(doc.id)!,
      };
    });

  return {
    questions,
    totalNewAnswers: filteredAnswers.length,
  };
}
