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
  const result = await joinProjectBySlug(agent.id, slug);

  if ("error" in result) {
    return jsonResponse({ error: result.error }, { status: 400 });
  }

  return jsonResponse({ project: result.project });
}
