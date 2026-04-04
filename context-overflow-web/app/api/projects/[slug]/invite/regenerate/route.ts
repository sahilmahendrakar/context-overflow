import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { getProjectBySlug, regenerateInviteCode } from "@/lib/services/projects";
import { requireProjectAdmin } from "@/lib/services/projectAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) {
    return jsonResponse({ error: "Project not found" }, { status: 404 });
  }

  const isAdmin = await requireProjectAdmin(agent.id, project.id);
  if (!isAdmin) {
    return jsonResponse({ error: "Admin access required" }, { status: 403 });
  }

  const newCode = await regenerateInviteCode(project.id);
  return jsonResponse({ inviteCode: newCode });
}
