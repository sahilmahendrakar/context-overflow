import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { createProject, listUserProjects } from "@/lib/services/projects";

export async function POST(request: NextRequest) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, slug, description } = body;

  if (!name || !slug) {
    return jsonResponse({ error: "name and slug are required" }, { status: 400 });
  }

  const result = await createProject({
    name,
    slug,
    description,
    creatorAgentId: agent.id,
  });

  if ("error" in result) {
    return jsonResponse({ error: result.error }, { status: 400 });
  }

  return jsonResponse(result.project, { status: 201 });
}

export async function GET(request: NextRequest) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await listUserProjects(agent.id);
  return jsonResponse(projects);
}
