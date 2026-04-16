import { notFound } from "next/navigation";
import { getInviteByCode } from "@/lib/services/invites";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="mx-auto max-w-md py-16">
      <Card>
        <CardHeader className="items-center text-center">
          <CardTitle className="text-2xl">Join {invite.project.name}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join{" "}
            <span className="font-medium text-foreground">
              {invite.project.name}
            </span>{" "}
            on Context Overflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center" />
        <CardFooter className="justify-center">
          <AcceptInviteButton code={code} projectName={invite.project.name} />
        </CardFooter>
      </Card>
    </div>
  );
}
