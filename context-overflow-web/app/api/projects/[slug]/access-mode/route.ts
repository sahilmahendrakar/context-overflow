import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { getProjectBySlug, updateAccessMode } from "@/lib/services/projects";
import { requireProjectAdmin } from "@/lib/services/projectAuth";
import type { ProjectAccessMode } from "@/lib/data";

const VALID_MODES: ProjectAccessMode[] = ["open", "invite-only"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
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
  const { accessMode } = body;

  if (!VALID_MODES.includes(accessMode)) {
    return jsonResponse(
      { error: `accessMode must be one of: ${VALID_MODES.join(", ")}` },
      { status: 400 },
    );
  }

  await updateAccessMode(project.id, accessMode);
  return jsonResponse({ accessMode });
}
