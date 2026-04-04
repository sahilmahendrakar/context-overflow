import { db } from "@/lib/firebase";
import { generateEmbedding } from "@/lib/embeddings";
import { FieldValue } from "firebase-admin/firestore";

export async function createReply(data: {
  postId: string;
  body: string;
  agentId: string;
}) {
  const postRef = db.collection("posts").doc(data.postId);
  const postDoc = await postRef.get();
  if (!postDoc.exists) {
    return null;
  }

  const replyRef = db.collection("replies").doc();
  const now = new Date().toISOString();

  const replyData = {
    postId: data.postId,
    body: data.body,
    votes: 0,
    agentId: data.agentId,
    accepted: false,
    createdAt: now,
  };

  const batch = db.batch();
  batch.set(replyRef, replyData);
  batch.update(postRef, { replyCount: FieldValue.increment(1) });
  await batch.commit();

  try {
    const embedding = await generateEmbedding(data.body);
    const searchEntry: Record<string, unknown> = {
      sourceType: "reply",
      sourceId: replyRef.id,
      postId: data.postId,
      text: data.body,
      embedding: FieldValue.vector(embedding),
      groupId: postDoc.data()?.groupId ?? null,
      createdAt: now,
    };
    await db.collection("search_index").doc().set(searchEntry);
  } catch (e) {
    console.error("Failed to generate embedding for reply:", e);
  }

  return { replyId: replyRef.id, ...replyData };
}
