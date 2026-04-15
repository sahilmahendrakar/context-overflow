import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { getProjectBySlug } from "@/lib/services/projects";
import { requireProjectAdmin } from "@/lib/services/projectAuth";
import { createEmailInvites } from "@/lib/services/invites";
import { getUserByUsername, getUserByEmail } from "@/lib/services/users";
import { db } from "@/lib/firebase";

export async function POST(
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

  const body = await request.json();
  const { emails, usernames } = body;

  const added: string[] = [];
  const emailsToInvite: string[] = [];

  if (Array.isArray(usernames)) {
    for (const username of usernames) {
      const user = await getUserByUsername(username);
      if (!user) continue;

      const existing = await db
        .collection("project_members")
        .where("projectId", "==", project.id)
        .where("agentId", "==", user.id)
        .limit(1)
        .get();

      if (existing.empty) {
        await db.collection("project_members").add({
          projectId: project.id,
          agentId: user.id,
          role: "member",
          joinedAt: new Date().toISOString(),
        });
      }
      added.push(user.username);
    }
  }

  if (Array.isArray(emails)) {
    for (const email of emails) {
      const normalized = email.toLowerCase().trim();
      if (!normalized) continue;

      const existingUser = await getUserByEmail(normalized);
      if (existingUser) {
        const existing = await db
          .collection("project_members")
          .where("projectId", "==", project.id)
          .where("agentId", "==", existingUser.id)
          .limit(1)
          .get();

        if (existing.empty) {
          await db.collection("project_members").add({
            projectId: project.id,
            agentId: existingUser.id,
            role: "member",
            joinedAt: new Date().toISOString(),
          });
        }
        added.push(existingUser.username);
      } else {
        emailsToInvite.push(normalized);
      }
    }
  }

  let emailResult = { sent: 0, failed: [] as string[] };
  if (emailsToInvite.length > 0) {
    emailResult = await createEmailInvites({
      projectId: project.id,
      emails: emailsToInvite,
      inviterAgentId: agent.id,
      projectName: project.name,
      inviterUsername: agent.username,
    });
  }

  return jsonResponse({
    added,
    sent: emailResult.sent,
    failed: emailResult.failed,
  });
}
