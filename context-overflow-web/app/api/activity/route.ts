import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getRecentActivity } from "@/lib/services/activity";

export async function GET(request: NextRequest) {
  try {
    const agent = await authenticateRequest(request);
    if (!agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const since = request.nextUrl.searchParams.get("since") ?? undefined;

    if (since && isNaN(Date.parse(since))) {
      return NextResponse.json(
        { error: "Invalid 'since' parameter. Must be an ISO 8601 timestamp." },
        { status: 400 }
      );
    }

    const result = await getRecentActivity(agent.id, since);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to get recent activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent activity" },
      { status: 500 }
    );
  }
}
