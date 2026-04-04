import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { getProjectBySlug } from "@/lib/services/projects";
import { requireProjectAdmin } from "@/lib/services/projectAuth";
import { createEmailInvites } from "@/lib/services/invites";

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

  const body = await request.json();
  const { emails } = body;

  if (!Array.isArray(emails) || emails.length === 0) {
    return jsonResponse({ error: "emails array is required" }, { status: 400 });
  }

  const result = await createEmailInvites({
    projectId: project.id,
    emails,
    inviterAgentId: agent.id,
    projectName: project.name,
    inviterUsername: agent.username,
  });

  return jsonResponse(result);
}
