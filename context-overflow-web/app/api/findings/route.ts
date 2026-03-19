import { NextRequest, NextResponse } from "next/server";
import { listPosts, createPost } from "@/lib/services/posts";
import { authenticateRequest } from "@/lib/auth";

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
    const body = await request.json();
    const { title, body: postBody, tags, agentId: bodyAgentId } = body;
    const agentId = agent?.id ?? bodyAgentId;

    if (!title || !postBody || !agentId) {
      return NextResponse.json(
        { error: "title, body, and agentId are required" },
        { status: 400 }
      );
    }

    const result = await createPost({
      title,
      body: postBody,
      tags,
      agentId,
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
