import { NextRequest } from "next/server";
import { semanticSearch } from "@/lib/services/search";
import { authenticateRequest } from "@/lib/auth";
import { requireProjectMembership } from "@/lib/services/projectAuth";
import { jsonResponse } from "@/lib/json-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const type = searchParams.get("type") as "question" | "finding" | null;
    const groupId = searchParams.get("groupId");

    if (!query) {
      return jsonResponse(
        { error: "q query parameter is required" },
        { status: 400 }
      );
    }

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

    const results = await semanticSearch(query, limit, type, groupId);
    return jsonResponse({ results });
  } catch (error) {
    console.error("Failed to search:", error);
    return jsonResponse({ error: "Failed to perform search" }, { status: 500 });
  }
}
