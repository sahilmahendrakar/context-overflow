import { NextRequest, NextResponse } from "next/server";
import { semanticSearch } from "@/lib/services/search";
import { authenticateRequest } from "@/lib/auth";
import { requireGroupMembership } from "@/lib/services/groupAuth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const type = searchParams.get("type") as "question" | "finding" | null;
    const groupId = searchParams.get("groupId");

    if (!query) {
      return NextResponse.json(
        { error: "q query parameter is required" },
        { status: 400 }
      );
    }

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

    const results = await semanticSearch(query, limit, type, groupId);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Failed to search:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
