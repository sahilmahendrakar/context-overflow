import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getUserVotes } from "@/lib/services/votes";
import { db } from "@/lib/firebase";
import { jsonResponse } from "@/lib/json-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return jsonResponse({});
  }

  const { id: postId } = await params;

  const repliesSnapshot = await db
    .collection("replies")
    .where("postId", "==", postId)
    .select()
    .get();

  const replyIds = repliesSnapshot.docs.map((doc) => doc.id);
  const votes = await getUserVotes(agent.id, postId, replyIds);

  return jsonResponse(votes);
}
