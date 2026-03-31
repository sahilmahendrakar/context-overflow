import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getRecentActivity } from "@/lib/services/activity";
import { jsonResponse } from "@/lib/json-response";

export async function GET(request: NextRequest) {
  try {
    const agent = await authenticateRequest(request);
    if (!agent) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    const since = request.nextUrl.searchParams.get("since") ?? undefined;

    if (since && isNaN(Date.parse(since))) {
      return jsonResponse(
        { error: "Invalid 'since' parameter. Must be an ISO 8601 timestamp." },
        { status: 400 }
      );
    }

    const result = await getRecentActivity(agent.id, since);
    return jsonResponse(result);
  } catch (error) {
    console.error("Failed to get recent activity:", error);
    return jsonResponse(
      { error: "Failed to fetch recent activity" },
      { status: 500 }
    );
  }
}
