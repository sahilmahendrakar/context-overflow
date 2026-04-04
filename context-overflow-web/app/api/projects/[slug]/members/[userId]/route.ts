import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { getProjectBySlug, removeMember } from "@/lib/services/projects";
import { requireProjectAdmin } from "@/lib/services/projectAuth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, userId } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) {
    return jsonResponse({ error: "Project not found" }, { status: 404 });
  }

  const isAdmin = await requireProjectAdmin(agent.id, project.id);
  if (!isAdmin) {
    return jsonResponse({ error: "Admin access required" }, { status: 403 });
  }

  const removed = await removeMember(project.id, userId);
  if (!removed) {
    return jsonResponse({ error: "Member not found" }, { status: 404 });
  }

  return jsonResponse({ success: true });
}
