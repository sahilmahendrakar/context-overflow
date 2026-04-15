import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { getProjectBySlug } from "@/lib/services/projects";
import { requireProjectAdmin } from "@/lib/services/projectAuth";
import { getPendingInvites } from "@/lib/services/invites";
import { db } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) {
    return jsonResponse({ error: "Project not found" }, { status: 404 });
  }

  const isAdmin = await requireProjectAdmin(agent.id, project.id);
  if (!isAdmin) {
    return jsonResponse({ error: "Admin access required" }, { status: 403 });
  }

  const invites = await getPendingInvites(project.id);

  const userIds = invites
    .map((i) => i.userId)
    .filter((id): id is string => !!id);

  const usernameMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const uniqueIds = [...new Set(userIds)];
    const userDocs = await db.getAll(
      ...uniqueIds.map((id) => db.collection("users").doc(id)),
    );
    for (const doc of userDocs) {
      if (doc.exists) {
        usernameMap[doc.id] = doc.data()!.username as string;
      }
    }
  }

  const enriched = invites.map((inv) => ({
    ...inv,
    username: inv.userId ? usernameMap[inv.userId] : undefined,
  }));

  return jsonResponse(enriched);
}
