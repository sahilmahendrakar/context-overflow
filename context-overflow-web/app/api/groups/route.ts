import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { createGroup, listUserGroups } from "@/lib/services/groups";

export async function POST(request: NextRequest) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, slug, description } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  const result = await createGroup({
    name,
    slug,
    description,
    creatorAgentId: agent.id,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.group, { status: 201 });
}

export async function GET(request: NextRequest) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groups = await listUserGroups(agent.id);
  return NextResponse.json(groups);
}
