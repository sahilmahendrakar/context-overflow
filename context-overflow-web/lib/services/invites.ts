import crypto from "crypto";
import { db } from "@/lib/firebase";
import { sendProjectInviteEmail } from "@/lib/email";
import type { ProjectInvite, Project } from "@/lib/data";

const LOG_PREFIX = "[email-invites]";

function generateInviteCode(): string {
  return crypto.randomBytes(16).toString("hex");
}

function inviteLinkForCode(code: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ctxoverflow.dev";
  return `${baseUrl}/invite/${code}`;
}

export async function createEmailInvites(params: {
  projectId: string;
  emails: string[];
  inviterAgentId: string;
  projectName: string;
  inviterUsername: string;
}): Promise<{ sent: number; failed: string[] }> {
  const { projectId, emails, inviterAgentId, projectName, inviterUsername } = params;
  const now = new Date().toISOString();
  const failed: string[] = [];
  let sent = 0;

  for (const email of emails) {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) continue;

    const existing = await db
      .collection("group_invites")
      .where("groupId", "==", projectId)
      .where("email", "==", normalizedEmail)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    let code: string;

    if (!existing.empty) {
      const data = existing.docs[0].data();
      code = data.code as string;
      if (!code) {
        console.error(LOG_PREFIX, "pending_invite_missing_code", {
          projectId,
          email: normalizedEmail,
          inviteDocId: existing.docs[0].id,
        });
        failed.push(normalizedEmail);
        continue;
      }
      console.info(LOG_PREFIX, "resend_pending_invite", {
        projectId,
        email: normalizedEmail,
      });
    } else {
      code = generateInviteCode();
      await db.collection("group_invites").add({
        groupId: projectId,
        email: normalizedEmail,
        invitedBy: inviterAgentId,
        code,
        status: "pending",
        createdAt: now,
      });
      console.info(LOG_PREFIX, "created_pending_invite", {
        projectId,
        email: normalizedEmail,
      });
    }

    const inviteLink = inviteLinkForCode(code);

    try {
      await sendProjectInviteEmail(normalizedEmail, projectName, inviterUsername, inviteLink);
      sent++;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(LOG_PREFIX, "send_failed", {
        projectId,
        email: normalizedEmail,
        error: message,
      });
      failed.push(normalizedEmail);
    }
  }

  console.info(LOG_PREFIX, "batch_complete", {
    projectId,
    sent,
    failedCount: failed.length,
  });

  return { sent, failed };
}

export async function getInviteByCode(
  code: string
): Promise<(ProjectInvite & { project: Project }) | null> {
  const snapshot = await db
    .collection("group_invites")
    .where("code", "==", code)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();

  const projectDoc = await db.collection("groups").doc(data.groupId).get();
  if (!projectDoc.exists) return null;

  return {
    id: doc.id,
    ...data,
    project: { id: projectDoc.id, ...projectDoc.data() },
  } as ProjectInvite & { project: Project };
}

export async function acceptInvite(
  code: string,
  agentId: string
): Promise<{ project: Project } | { error: string }> {
  const invite = await getInviteByCode(code);
  if (!invite) {
    return { error: "Invalid or expired invite." };
  }

  const existing = await db
    .collection("group_members")
    .where("groupId", "==", invite.groupId)
    .where("agentId", "==", agentId)
    .limit(1)
    .get();

  const batch = db.batch();

  if (existing.empty) {
    const memberRef = db.collection("group_members").doc();
    batch.set(memberRef, {
      groupId: invite.groupId,
      agentId,
      role: "member",
      joinedAt: new Date().toISOString(),
    });
  }

  const inviteRef = db.collection("group_invites").doc(invite.id);
  batch.update(inviteRef, { status: "accepted" });

  await batch.commit();

  return { project: invite.project };
}
