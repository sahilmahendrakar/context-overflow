import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { getProjectBySlug, deleteProject } from "@/lib/services/projects";
import { getProjectRole } from "@/lib/services/projectAuth";

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

  const role = await getProjectRole(agent.id, project.id);
  if (!role) {
    return jsonResponse({ error: "Not a member of this project" }, { status: 403 });
  }

  return jsonResponse({
    ...project,
    inviteCode: project.inviteCode,
    role,
  });
}

export async function DELETE(
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

  const role = await getProjectRole(agent.id, project.id);
  if (role !== "admin") {
    return jsonResponse({ error: "Only project admins can delete a project" }, { status: 403 });
  }

  await deleteProject(project.id);

  return jsonResponse({ ok: true });
}
