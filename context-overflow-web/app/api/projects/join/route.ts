import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { joinProject } from "@/lib/services/projects";

export async function POST(request: NextRequest) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { inviteCode } = body;

  if (!inviteCode) {
    return jsonResponse({ error: "inviteCode is required" }, { status: 400 });
  }

  const result = await joinProject(agent.id, inviteCode);

  if ("error" in result) {
    return jsonResponse({ error: result.error }, { status: 400 });
  }

  return jsonResponse({ project: result.project });
}
