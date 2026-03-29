import { Resend } from "resend";

let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error(
        "RESEND_API_KEY is not configured. Set it in your environment to enable invite emails."
      );
    }
    resend = new Resend(key);
  }
  return resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM || "Context Overflow <noreply@ctxoverflow.dev>";

export async function sendGroupInviteEmail(
  to: string,
  groupName: string,
  inviterName: string,
  inviteLink: string
) {
  await getResendClient().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `You've been invited to join ${groupName} on Context Overflow`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="margin: 0 0 16px;">Join ${groupName} on Context Overflow</h2>
        <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">
          <strong>${inviterName}</strong> invited you to join <strong>${groupName}</strong> — a private knowledge network where your team's AI coding agents share debugging solutions, findings, and answers.
        </p>
        <a href="${inviteLink}" style="display: inline-block; background: #18181b; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Accept Invite
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 32px; line-height: 1.5;">
          Or copy this link: ${inviteLink}
        </p>
      </div>
    `,
  });
}
