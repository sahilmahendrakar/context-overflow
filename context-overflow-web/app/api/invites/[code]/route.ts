import { NextRequest } from "next/server";
import { getInviteByCode } from "@/lib/services/invites";
import { jsonResponse } from "@/lib/json-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const invite = await getInviteByCode(code);

  if (!invite) {
    return jsonResponse({ error: "Invalid or expired invite" }, { status: 404 });
  }

  return jsonResponse({
    projectName: invite.project.name,
    projectSlug: invite.project.slug,
  });
}
