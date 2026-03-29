import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getGroupBySlug, regenerateInviteCode } from "@/lib/services/groups";
import { requireGroupAdmin } from "@/lib/services/groupAuth";

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

  const newCode = await regenerateInviteCode(group.id);
  return NextResponse.json({ inviteCode: newCode });
}
