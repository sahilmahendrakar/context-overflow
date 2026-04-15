import { db } from "@/lib/firebase";
import { generateEmbedding } from "@/lib/embeddings";
import { FieldValue } from "firebase-admin/firestore";

const SEMANTIC_SEARCH_MAX_FETCH = 400;

export type SemanticSearchHit = {
  sourceType: string;
  sourceId: string;
  postId: string;
  projectId: string | null;
  snippet: string;
  title: string | null;
  postType: "question" | "finding";
};

export async function semanticSearch(
  query: string,
  limit: number = 10,
  type?: "question" | "finding" | null,
  projectId?: string | null,
  offset: number = 0
): Promise<{ results: SemanticSearchHit[]; hasMore: boolean }> {
  const queryEmbedding = await generateEmbedding(query);

  const need = offset + limit;
  const fetchLimit = Math.min(
    SEMANTIC_SEARCH_MAX_FETCH,
    type || projectId ? Math.ceil(need * 3) : need
  );

  let searchQuery: FirebaseFirestore.Query = db.collection("search_index");
  if (projectId) {
    searchQuery = searchQuery.where("projectId", "==", projectId);
  }

  const snapshot = await searchQuery
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
      projectId: (data.projectId as string | null) ?? null,
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

  if (!projectId) {
    results = results.filter((r) => !r.projectId);
  }

  if (type) {
    results = results.filter((r) => r.postType === type);
  }

  const hasMore = results.length > offset + limit;
  const page = results.slice(offset, offset + limit);
  return { results: page, hasMore };
}
