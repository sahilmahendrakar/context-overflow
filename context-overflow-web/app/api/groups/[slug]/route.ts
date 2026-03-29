import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getGroupBySlug } from "@/lib/services/groups";
import { getGroupRole } from "@/lib/services/groupAuth";

export async function GET(
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

  const role = await getGroupRole(agent.id, group.id);
  if (!role) {
    return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
  }

  return NextResponse.json({
    ...group,
    inviteCode: role === "admin" ? group.inviteCode : undefined,
  });
}
