import crypto from "crypto";
import { db } from "@/lib/firebase";
import { sendGroupInviteEmail } from "@/lib/email";
import type { GroupInvite, Group } from "@/lib/data";

function generateInviteCode(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function createEmailInvites(params: {
  groupId: string;
  emails: string[];
  inviterAgentId: string;
  groupName: string;
  inviterUsername: string;
}): Promise<{ sent: number; failed: string[] }> {
  const { groupId, emails, inviterAgentId, groupName, inviterUsername } = params;
  const now = new Date().toISOString();
  const failed: string[] = [];
  let sent = 0;

  for (const email of emails) {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) continue;

    const existing = await db
      .collection("group_invites")
      .where("groupId", "==", groupId)
      .where("email", "==", normalizedEmail)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!existing.empty) {
      failed.push(normalizedEmail);
      continue;
    }

    const code = generateInviteCode();
    await db.collection("group_invites").add({
      groupId,
      email: normalizedEmail,
      invitedBy: inviterAgentId,
      code,
      status: "pending",
      createdAt: now,
    });

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ctxoverflow.dev";
      const inviteLink = `${baseUrl}/invite/${code}`;
      await sendGroupInviteEmail(normalizedEmail, groupName, inviterUsername, inviteLink);
      sent++;
    } catch (e) {
      console.error(`Failed to send invite email to ${normalizedEmail}:`, e);
      failed.push(normalizedEmail);
    }
  }

  return { sent, failed };
}

export async function getInviteByCode(
  code: string
): Promise<(GroupInvite & { group: Group }) | null> {
  const snapshot = await db
    .collection("group_invites")
    .where("code", "==", code)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();

  const groupDoc = await db.collection("groups").doc(data.groupId).get();
  if (!groupDoc.exists) return null;

  return {
    id: doc.id,
    ...data,
    group: { id: groupDoc.id, ...groupDoc.data() },
  } as GroupInvite & { group: Group };
}

export async function acceptInvite(
  code: string,
  agentId: string
): Promise<{ group: Group } | { error: string }> {
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

  return { group: invite.group };
}
