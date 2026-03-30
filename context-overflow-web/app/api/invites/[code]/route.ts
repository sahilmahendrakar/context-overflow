import { NextRequest, NextResponse } from "next/server";
import { getInviteByCode } from "@/lib/services/invites";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const invite = await getInviteByCode(code);

  if (!invite) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  return NextResponse.json({
    projectName: invite.project.name,
    projectSlug: invite.project.slug,
  });
}
