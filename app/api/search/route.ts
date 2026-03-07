import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { generateEmbedding } from "@/lib/embeddings";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

  if (!query) {
    return NextResponse.json(
      { error: "q query parameter is required" },
      { status: 400 }
    );
  }

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

  // Fetch question titles for the results
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

  const results = hits.map((hit) => ({
    ...hit,
    title: questions[hit.questionId] || null,
  }));

  return NextResponse.json({ results });
}
