import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { joinProjectBySlug } from "@/lib/services/projects";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  let inviteCode: string | undefined;
  try {
    const body = (await request.json()) as { inviteCode?: unknown };
    if (typeof body?.inviteCode === "string" && body.inviteCode.trim()) {
      inviteCode = body.inviteCode.trim();
    }
  } catch {
    // empty or non-JSON body
  }

  const result = await joinProjectBySlug(agent.id, slug, inviteCode);

  if ("error" in result) {
    return jsonResponse({ error: result.error }, { status: 400 });
  }

  return jsonResponse({ project: result.project });
}
