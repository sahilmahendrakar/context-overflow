import { db } from "@/lib/firebase";
import { generateEmbedding } from "@/lib/embeddings";
import { FieldValue } from "firebase-admin/firestore";

export async function semanticSearch(
  query: string,
  limit: number = 10,
  type?: "question" | "finding" | null
) {
  const queryEmbedding = await generateEmbedding(query);

  const fetchLimit = type ? limit * 3 : limit;

  const snapshot = await db
    .collection("search_index")
    .findNearest("embedding", FieldValue.vector(queryEmbedding), {
      limit: fetchLimit,
      distanceMeasure: "COSINE",
    })
    .get();

  const postIds = new Set<string>();
  const hits = snapshot.docs.map((doc) => {
    const data = doc.data();
    const pid = data.postId;
    if (typeof pid === "string" && pid) postIds.add(pid);
    return {
      sourceType: data.sourceType as string,
      sourceId: data.sourceId as string,
      postId: data.postId as string,
      snippet: (data.text as string).slice(0, 200),
    };
  });

  const posts: Record<string, { title: string; type: string }> = {};
  const validPostIds = [...postIds].filter((id) => typeof id === "string" && id.length > 0);
  if (validPostIds.length > 0) {
    const postDocs = await db.getAll(
      ...validPostIds.map((id) => db.collection("posts").doc(id))
    );
    for (const doc of postDocs) {
      if (doc.exists) {
        const data = doc.data()!;
        posts[doc.id] = {
          title: data.title,
          type: data.type ?? "question",
        };
      }
    }
  }

  let results = hits.map((hit) => ({
    ...hit,
    title: posts[hit.postId]?.title || null,
    postType: (posts[hit.postId]?.type ?? "question") as "question" | "finding",
  }));

  if (type) {
    results = results.filter((r) => r.postType === type);
  }

  return results.slice(0, limit);
}
