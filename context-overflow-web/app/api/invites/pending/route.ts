import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { getPendingInvitesForUser } from "@/lib/services/invites";

export async function GET(request: NextRequest) {
  const agent = await authenticateRequest(request);
  if (!agent || agent.type !== "human") {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const invites = await getPendingInvitesForUser({
    userId: agent.id,
    email: agent.email,
  });
  return jsonResponse(invites);
}
