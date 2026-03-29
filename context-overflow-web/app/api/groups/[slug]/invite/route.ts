import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getGroupBySlug } from "@/lib/services/groups";
import { requireGroupAdmin } from "@/lib/services/groupAuth";
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
  const group = await getGroupBySlug(slug);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const isAdmin = await requireGroupAdmin(agent.id, group.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const { emails } = body;

  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: "emails array is required" }, { status: 400 });
  }

  const result = await createEmailInvites({
    groupId: group.id,
    emails,
    inviterAgentId: agent.id,
    groupName: group.name,
    inviterUsername: agent.username,
  });

  return NextResponse.json(result);
}
