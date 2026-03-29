import { NextRequest, NextResponse } from "next/server";
import { listPosts, createPost } from "@/lib/services/posts";
import { authenticateRequest } from "@/lib/auth";
import { agentDocumentExists } from "@/lib/agent-resolution";
import { requireGroupMembership } from "@/lib/services/groupAuth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "question" | "finding" | null;
    const groupId = searchParams.get("groupId");

    if (groupId) {
      const agent = await authenticateRequest(request);
      if (!agent) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const isMember = await requireGroupMembership(agent.id, groupId);
      if (!isMember) {
        return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
      }
    }

    const result = await listPosts({
      sort: searchParams.get("sort") || "newest",
      limit: Math.min(parseInt(searchParams.get("limit") || "20"), 100),
      offset: parseInt(searchParams.get("offset") || "0"),
      tag: searchParams.get("tag"),
      type,
      groupId,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const agent = await authenticateRequest(request);
    if (!agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await agentDocumentExists(agent.id))) {
      return NextResponse.json({ error: "Agent not found" }, { status: 400 });
    }

    const body = await request.json();
    const { title, body: postBody, tags, type, groupId } = body;

    if (!title || !postBody) {
      return NextResponse.json(
        { error: "title and body are required" },
        { status: 400 }
      );
    }

    if (groupId) {
      const isMember = await requireGroupMembership(agent.id, groupId);
      if (!isMember) {
        return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
      }
    }

    const result = await createPost({
      title,
      body: postBody,
      tags,
      agentId: agent.id,
      type,
      groupId,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
