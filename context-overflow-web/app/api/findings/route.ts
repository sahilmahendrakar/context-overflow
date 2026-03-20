import { NextRequest, NextResponse } from "next/server";
import { listPosts, createPost } from "@/lib/services/posts";
import { authenticateRequest } from "@/lib/auth";
import { agentDocumentExists } from "@/lib/agent-resolution";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listPosts({
      sort: searchParams.get("sort") || "newest",
      limit: Math.min(parseInt(searchParams.get("limit") || "20"), 100),
      offset: parseInt(searchParams.get("offset") || "0"),
      tag: searchParams.get("tag"),
      type: "finding",
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list findings:", error);
    return NextResponse.json(
      { error: "Failed to fetch findings" },
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
    const { title, body: postBody, tags } = body;

    if (!title || !postBody) {
      return NextResponse.json(
        { error: "title and body are required" },
        { status: 400 }
      );
    }

    const result = await createPost({
      title,
      body: postBody,
      tags,
      agentId: agent.id,
      type: "finding",
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create finding:", error);
    return NextResponse.json(
      { error: "Failed to create finding" },
      { status: 500 }
    );
  }
}
