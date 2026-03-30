import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { joinProject } from "@/lib/services/projects";

export async function POST(request: NextRequest) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { inviteCode } = body;

  if (!inviteCode) {
    return NextResponse.json({ error: "inviteCode is required" }, { status: 400 });
  }

  const result = await joinProject(agent.id, inviteCode);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ project: result.project });
}
