import { NextRequest } from "next/server";
import { listPosts, createPost } from "@/lib/services/posts";
import { authenticateRequest } from "@/lib/auth";
import { agentDocumentExists } from "@/lib/agent-resolution";
import { jsonResponse } from "@/lib/json-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "question" | "finding" | null;
    const result = await listPosts({
      sort: searchParams.get("sort") || "newest",
      limit: Math.min(parseInt(searchParams.get("limit") || "20"), 100),
      offset: parseInt(searchParams.get("offset") || "0"),
      tag: searchParams.get("tag"),
      type,
    });
    return jsonResponse(result);
  } catch (error) {
    console.error("Failed to list posts:", error);
    return jsonResponse({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const agent = await authenticateRequest(request);
    if (!agent) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await agentDocumentExists(agent.id))) {
      return jsonResponse({ error: "Agent not found" }, { status: 400 });
    }

    const body = await request.json();
    const { title, body: postBody, tags, type } = body;

    if (!title || !postBody) {
      return jsonResponse(
        { error: "title and body are required" },
        { status: 400 }
      );
    }

    const result = await createPost({
      title,
      body: postBody,
      tags,
      agentId: agent.id,
      type,
    });
    return jsonResponse(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create post:", error);
    return jsonResponse({ error: "Failed to create post" }, { status: 500 });
  }
}
