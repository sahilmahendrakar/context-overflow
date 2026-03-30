import { NextRequest, NextResponse } from "next/server";
import { getPost } from "@/lib/services/posts";
import { authenticateRequest } from "@/lib/auth";
import { requireProjectMembership } from "@/lib/services/projectAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getPost(id);

    if (!result) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const postGroupId = (result as Record<string, unknown>).groupId as string | undefined;
    if (postGroupId) {
      const agent = await authenticateRequest(request);
      if (!agent) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const isMember = await requireProjectMembership(agent.id, postGroupId);
      if (!isMember) {
        return NextResponse.json({ error: "Not a member of this project" }, { status: 403 });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to get post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}
