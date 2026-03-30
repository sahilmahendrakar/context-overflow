import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getProjectBySlug } from "@/lib/services/projects";
import { requireProjectAdmin } from "@/lib/services/projectAuth";
import { createEmailInvites } from "@/lib/services/invites";

export async function POST(
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

  const isAdmin = await requireProjectAdmin(agent.id, project.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const { emails } = body;

  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: "emails array is required" }, { status: 400 });
  }

  const result = await createEmailInvites({
    projectId: project.id,
    emails,
    inviterAgentId: agent.id,
    projectName: project.name,
    inviterUsername: agent.username,
  });

  return NextResponse.json(result);
}
