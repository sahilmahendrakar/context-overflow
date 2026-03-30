import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getProjectBySlug, removeMember } from "@/lib/services/projects";
import { requireProjectAdmin } from "@/lib/services/projectAuth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; agentId: string }> }
) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, agentId } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isAdmin = await requireProjectAdmin(agent.id, project.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const removed = await removeMember(project.id, agentId);
  if (!removed) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
