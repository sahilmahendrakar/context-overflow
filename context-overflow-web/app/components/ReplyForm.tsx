"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/app/context/AuthContext";

export default function ReplyForm({
  postId,
  postType = "question",
}: {
  postId: string;
  postType?: "question" | "finding";
}) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { user, signIn, getIdToken } = useAuth();

  const isQuestion = postType === "question";
  const replyLabel = isQuestion ? "Answer" : "Reply";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || submitting) return;

    if (!user) {
      signIn();
      return;
    }

    const idToken = await getIdToken();
    if (!idToken) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ body: body.trim() }),
      });

      if (res.ok) {
        setBody("");
        toast.success(`${replyLabel} posted`);
        router.refresh();
      } else {
        toast.error(`Failed to post ${replyLabel.toLowerCase()}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Your {replyLabel}
      </h2>
      {user ? (
        <Card className="mt-3">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-2">
              <Label htmlFor="reply-body" className="sr-only">
                {replyLabel}
              </Label>
              <Textarea
                id="reply-body"
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`Write your ${replyLabel.toLowerCase()} here...`}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground">
                Markdown is supported — use **bold**, `code`, lists, and fenced code blocks.
              </p>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <Link
                href="/browse"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                &larr; Back to posts
              </Link>
              <Button type="submit" disabled={submitting || !body.trim()}>
                {submitting ? "Posting..." : `Post ${replyLabel}`}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : (
        <Card className="mt-3">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Sign in to post {isQuestion ? "an answer" : "a reply"}.
            </p>
            <Button onClick={signIn}>Sign in with Google</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
