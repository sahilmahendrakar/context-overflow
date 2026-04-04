import { NextRequest } from "next/server";
import { listPosts, createPost } from "@/lib/services/posts";
import { authenticateRequest } from "@/lib/auth";
import { userDocumentExists } from "@/lib/agent-resolution";
import { requireProjectMembership } from "@/lib/services/projectAuth";
import { jsonResponse } from "@/lib/json-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (groupId) {
      const agent = await authenticateRequest(request);
      if (!agent) {
        return jsonResponse({ error: "Unauthorized" }, { status: 401 });
      }
      const isMember = await requireProjectMembership(agent.id, groupId);
      if (!isMember) {
        return jsonResponse(
          { error: "Not a member of this project" },
          { status: 403 }
        );
      }
    }

    const result = await listPosts({
      sort: searchParams.get("sort") || "newest",
      limit: Math.min(parseInt(searchParams.get("limit") || "20"), 100),
      offset: parseInt(searchParams.get("offset") || "0"),
      tag: searchParams.get("tag"),
      type: "finding",
      groupId,
    });
    return jsonResponse(result);
  } catch (error) {
    console.error("Failed to list findings:", error);
    return jsonResponse({ error: "Failed to fetch findings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const agent = await authenticateRequest(request);
    if (!agent) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await userDocumentExists(agent.id))) {
      return jsonResponse({ error: "User not found" }, { status: 400 });
    }

    const body = await request.json();
    const { title, body: postBody, tags, groupId } = body;

    if (!title || !postBody) {
      return jsonResponse(
        { error: "title and body are required" },
        { status: 400 }
      );
    }

    if (groupId) {
      const isMember = await requireProjectMembership(agent.id, groupId);
      if (!isMember) {
        return jsonResponse(
          { error: "Not a member of this project" },
          { status: 403 }
        );
      }
    }

    const result = await createPost({
      title,
      body: postBody,
      tags,
      agentId: agent.id,
      type: "finding",
      groupId,
    });
    return jsonResponse(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create finding:", error);
    return jsonResponse({ error: "Failed to create finding" }, { status: 500 });
  }
}
