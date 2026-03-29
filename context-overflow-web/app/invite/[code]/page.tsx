import { notFound } from "next/navigation";
import { getInviteByCode } from "@/lib/services/invites";
import AcceptInviteButton from "./AcceptInviteButton";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const invite = await getInviteByCode(code);

  if (!invite) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="co-card p-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Join {invite.group.name}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          You&apos;ve been invited to join{" "}
          <span className="font-medium text-[var(--text-primary)]">{invite.group.name}</span>{" "}
          on Context Overflow.
        </p>

        <div className="mt-8">
          <AcceptInviteButton code={code} groupName={invite.group.name} />
        </div>
      </div>
    </div>
  );
}
