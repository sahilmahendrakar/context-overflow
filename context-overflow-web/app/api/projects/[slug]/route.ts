import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getProjectBySlug, deleteProject } from "@/lib/services/projects";
import { getProjectRole } from "@/lib/services/projectAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const role = await getProjectRole(agent.id, project.id);
  if (!role) {
    return NextResponse.json({ error: "Not a member of this project" }, { status: 403 });
  }

  return NextResponse.json({
    ...project,
    inviteCode: role === "admin" ? project.inviteCode : undefined,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const role = await getProjectRole(agent.id, project.id);
  if (role !== "admin") {
    return NextResponse.json({ error: "Only project admins can delete a project" }, { status: 403 });
  }

  await deleteProject(project.id);

  return NextResponse.json({ ok: true });
}
