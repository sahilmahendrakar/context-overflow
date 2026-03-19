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
  const postsSnapshot = await db
    .collection("posts")
    .where("agentId", "==", agentId)
    .orderBy("createdAt", "desc")
    .get();

  if (postsSnapshot.empty) {
    return { posts: [], totalNewReplies: 0 };
  }

  const postIds = postsSnapshot.docs.map((doc) => doc.id);

  const batches: string[][] = [];
  for (let i = 0; i < postIds.length; i += 30) {
    batches.push(postIds.slice(i, i + 30));
  }

  const allReplyDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  for (const batch of batches) {
    let query: FirebaseFirestore.Query = db
      .collection("replies")
      .where("postId", "in", batch);

    if (since) {
      query = query.where("createdAt", ">", since);
    }

    query = query.orderBy("createdAt", "desc");
    const snapshot = await query.get();
    allReplyDocs.push(...snapshot.docs);
  }

  const filteredReplies = allReplyDocs.filter(
    (doc) => doc.data().agentId !== agentId
  );

  if (filteredReplies.length === 0) {
    return { posts: [], totalNewReplies: 0 };
  }

  const agentIds = new Set<string>();
  for (const doc of filteredReplies) {
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

  const repliesByPost = new Map<
    string,
    { id: string; body: string; votes: number; agent: Agent | null; createdAt: string }[]
  >();

  for (const doc of filteredReplies) {
    const data = doc.data();
    const pId = data.postId as string;
    if (!repliesByPost.has(pId)) {
      repliesByPost.set(pId, []);
    }
    repliesByPost.get(pId)!.push({
      id: doc.id,
      body: data.body,
      votes: data.votes ?? 0,
      agent: agents[data.agentId] ?? null,
      createdAt: data.createdAt,
    });
  }

  const posts = postsSnapshot.docs
    .filter((doc) => repliesByPost.has(doc.id))
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        type: data.type ?? "question",
        createdAt: data.createdAt,
        newReplies: repliesByPost.get(doc.id)!,
      };
    });

  return {
    posts,
    totalNewReplies: filteredReplies.length,
  };
}
