import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { acceptInvite } from "@/lib/services/invites";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const result = await acceptInvite(code, agent.id);

  if ("error" in result) {
    return jsonResponse({ error: result.error }, { status: 400 });
  }

  return jsonResponse({ project: result.project });
}
