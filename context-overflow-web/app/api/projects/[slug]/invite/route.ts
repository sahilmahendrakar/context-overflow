import crypto from "crypto";
import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { getProjectBySlug } from "@/lib/services/projects";
import { requireProjectAdmin } from "@/lib/services/projectAuth";
import { createEmailInvites } from "@/lib/services/invites";
import { getUserByUsername, getUserByEmail, getUserEmail } from "@/lib/services/users";
import { sendProjectInviteEmail } from "@/lib/email";
import { db } from "@/lib/firebase";

function generateInviteCode(): string {
  return crypto.randomBytes(16).toString("hex");
}

function inviteLinkForCode(code: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ctxoverflow.dev";
  return `${baseUrl}/invite/${code}`;
}

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

  const invited: string[] = [];
  const alreadyMember: string[] = [];
  const emailsToInvite: string[] = [];

  if (Array.isArray(usernames)) {
    for (const username of usernames) {
      const user = await getUserByUsername(username);
      if (!user) continue;

      const existingMember = await db
        .collection("project_members")
        .where("projectId", "==", project.id)
        .where("agentId", "==", user.id)
        .limit(1)
        .get();

      if (!existingMember.empty) {
        alreadyMember.push(user.username);
        continue;
      }

      const existingInvite = await db
        .collection("project_invites")
        .where("projectId", "==", project.id)
        .where("userId", "==", user.id)
        .where("status", "==", "pending")
        .limit(1)
        .get();

      if (!existingInvite.empty) {
        invited.push(user.username);
        continue;
      }

      const code = generateInviteCode();
      const email = await getUserEmail(user.id);

      await db.collection("project_invites").add({
        projectId: project.id,
        userId: user.id,
        email: email ?? "",
        invitedBy: agent.id,
        code,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      if (email) {
        try {
          await sendProjectInviteEmail(
            email,
            project.name,
            agent.username,
            inviteLinkForCode(code),
          );
        } catch {
          // Email delivery failure shouldn't block invite creation
        }
      }

      invited.push(user.username);
    }
  }

  if (Array.isArray(emails)) {
    for (const email of emails) {
      const normalized = email.toLowerCase().trim();
      if (!normalized) continue;

      const existingUser = await getUserByEmail(normalized);
      if (existingUser) {
        const existingMember = await db
          .collection("project_members")
          .where("projectId", "==", project.id)
          .where("agentId", "==", existingUser.id)
          .limit(1)
          .get();

        if (!existingMember.empty) {
          alreadyMember.push(existingUser.username);
          continue;
        }

        const existingInvite = await db
          .collection("project_invites")
          .where("projectId", "==", project.id)
          .where("userId", "==", existingUser.id)
          .where("status", "==", "pending")
          .limit(1)
          .get();

        if (!existingInvite.empty) {
          invited.push(existingUser.username);
          continue;
        }

        const code = generateInviteCode();

        await db.collection("project_invites").add({
          projectId: project.id,
          userId: existingUser.id,
          email: normalized,
          invitedBy: agent.id,
          code,
          status: "pending",
          createdAt: new Date().toISOString(),
        });

        try {
          await sendProjectInviteEmail(
            normalized,
            project.name,
            agent.username,
            inviteLinkForCode(code),
          );
        } catch {
          // Email delivery failure shouldn't block invite creation
        }

        invited.push(existingUser.username);
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
    invited,
    alreadyMember,
    sent: emailResult.sent,
    failed: emailResult.failed,
  });
}
