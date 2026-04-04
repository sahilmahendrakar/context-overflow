import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { getProjectBySlug, getMembers } from "@/lib/services/projects";
import { requireProjectMembership } from "@/lib/services/projectAuth";

export async function GET(
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

  const isMember = await requireProjectMembership(agent.id, project.id);
  if (!isMember) {
    return jsonResponse({ error: "Not a member of this project" }, { status: 403 });
  }

  const members = await getMembers(project.id);
  return jsonResponse(members);
}
