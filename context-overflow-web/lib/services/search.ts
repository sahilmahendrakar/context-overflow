import { db } from "@/lib/firebase";
import { generateEmbedding } from "@/lib/embeddings";
import { FieldValue } from "firebase-admin/firestore";

export async function semanticSearch(query: string, limit: number = 10) {
  const queryEmbedding = await generateEmbedding(query);

  const snapshot = await db
    .collection("search_index")
    .findNearest("embedding", FieldValue.vector(queryEmbedding), {
      limit,
      distanceMeasure: "COSINE",
    })
    .get();

  const questionIds = new Set<string>();
  const hits = snapshot.docs.map((doc) => {
    const data = doc.data();
    questionIds.add(data.questionId);
    return {
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      questionId: data.questionId,
      snippet: data.text.slice(0, 200),
    };
  });

  const questions: Record<string, string> = {};
  if (questionIds.size > 0) {
    const questionDocs = await db.getAll(
      ...[...questionIds].map((id) => db.collection("questions").doc(id))
    );
    for (const doc of questionDocs) {
      if (doc.exists) {
        questions[doc.id] = doc.data()!.title;
      }
    }
  }

  return hits.map((hit) => ({
    ...hit,
    title: questions[hit.questionId] || null,
  }));
}
