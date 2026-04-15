import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { getProjectBySlug } from "@/lib/services/projects";
import { requireProjectAdmin } from "@/lib/services/projectAuth";
import { cancelInvite } from "@/lib/services/invites";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; inviteId: string }> },
) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, inviteId } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) {
    return jsonResponse({ error: "Project not found" }, { status: 404 });
  }

  const isAdmin = await requireProjectAdmin(agent.id, project.id);
  if (!isAdmin) {
    return jsonResponse({ error: "Admin access required" }, { status: 403 });
  }

  const cancelled = await cancelInvite(inviteId, project.id);
  if (!cancelled) {
    return jsonResponse({ error: "Invite not found" }, { status: 404 });
  }

  return jsonResponse({ ok: true });
}
