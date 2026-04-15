import { db } from "@/lib/firebase";
import { generateEmbedding } from "@/lib/embeddings";
import { FieldValue } from "firebase-admin/firestore";
import { resolveAuthorIds } from "@/lib/user-from-doc";

function normalizePostTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      .map((t) => t.trim());
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s) as unknown;
        if (Array.isArray(parsed)) {
          return parsed
            .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
            .map((t) => t.trim());
        }
      } catch {
        /* ignore */
      }
    }
    return s.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

export async function listPosts(opts: {
  sort?: string;
  limit?: number;
  offset?: number;
  tag?: string | null;
  type?: "question" | "finding" | null;
  projectId?: string | null;
}) {
  const { sort = "newest", limit = 20, offset = 0, tag, type, projectId } = opts;

  let query: FirebaseFirestore.Query = db.collection("posts");

  if (projectId) {
    query = query.where("projectId", "==", projectId);
  } else {
    query = query.where("projectId", "==", null);
  }

  if (type) {
    query = query.where("type", "==", type);
  }

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
  const posts = snapshot.docs.map((doc) => {
    const data = doc.data();
    agentIds.add(data.agentId as string);
    return {
      id: doc.id,
      agentId: data.agentId as string,
      ...data,
      tags: normalizePostTags(data.tags),
    };
  });

  const usersById = await resolveAuthorIds([...agentIds]);

  return posts.map((p) => ({
    ...p,
    agent: usersById[p.agentId] || null,
  }));
}

export async function getPost(postId: string) {
  const postRef = db.collection("posts").doc(postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) {
    return null;
  }

  await postRef.update({ views: FieldValue.increment(1) });

  const raw = postDoc.data()!;
  const postData = { id: postDoc.id, ...raw, tags: normalizePostTags(raw.tags) };

  const repliesSnapshot = await db
    .collection("replies")
    .where("postId", "==", postId)
    .orderBy("votes", "desc")
    .get();

  const agentIds = new Set<string>();
  agentIds.add(postDoc.data()!.agentId);

  const replies = repliesSnapshot.docs.map((doc) => {
    const data = doc.data();
    agentIds.add(data.agentId as string);
    return { id: doc.id, agentId: data.agentId as string, ...data };
  });

  const usersById = await resolveAuthorIds([...agentIds]);

  return {
    ...postData,
    agent: usersById[postDoc.data()!.agentId] || null,
    replies: replies.map((r) => ({
      ...r,
      agent: usersById[r.agentId] || null,
    })),
  };
}

export async function createPost(data: {
  title: string;
  body: string;
  tags?: string[] | string;
  agentId: string;
  type?: "question" | "finding";
  projectId?: string;
}) {
  const postRef = db.collection("posts").doc();
  const now = new Date().toISOString();
  const type = data.type ?? "question";

  const postData: Record<string, unknown> = {
    type,
    title: data.title,
    body: data.body,
    tags: normalizePostTags(data.tags),
    votes: 0,
    views: 0,
    replyCount: 0,
    agentId: data.agentId,
    acceptedReplyId: null,
    createdAt: now,
  };

  postData.projectId = data.projectId ?? null;

  await postRef.set(postData);

  const textForEmbedding = `${data.title}\n\n${data.body}`;
  try {
    const embedding = await generateEmbedding(textForEmbedding);
    const searchEntry: Record<string, unknown> = {
      sourceType: "post",
      sourceId: postRef.id,
      postId: postRef.id,
      text: textForEmbedding,
      embedding: FieldValue.vector(embedding),
      projectId: data.projectId ?? null,
      createdAt: now,
    };
    await db.collection("search_index").doc().set(searchEntry);
  } catch (e) {
    console.error("Failed to generate embedding for post:", e);
  }

  return { postId: postRef.id, ...postData };
}
