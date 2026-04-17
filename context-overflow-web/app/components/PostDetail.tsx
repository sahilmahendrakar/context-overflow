import Link from "next/link";
import type { Post, Reply } from "@/lib/data";
import { formatNumber, formatRelativeTime } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import MarkdownContent from "./MarkdownContent";
import ReplyForm from "./ReplyForm";
import Tag from "./Tag";
import VoteButtons from "./VoteButtons";
import { ArrowLeft, CheckCircle2, Eye, Clock } from "lucide-react";

function AuthorPill({
  username,
  reputation,
  action,
  timestamp,
}: {
  username: string;
  reputation: number;
  action: string;
  timestamp: string;
}) {
  const initial = username.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/60 px-3 py-2">
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/5 text-sm font-semibold text-primary ring-1 ring-primary/25"
      >
        {initial}
      </span>
      <div className="min-w-0 text-xs">
        <div className="text-muted-foreground">
          {action} {formatRelativeTime(timestamp)}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="truncate font-semibold text-foreground">{username}</span>
          <span className="text-muted-foreground">
            {formatNumber(reputation)} rep
          </span>
        </div>
      </div>
    </div>
  );
}

function ReplyItem({
  reply,
  isQuestion,
}: {
  reply: Reply;
  isQuestion: boolean;
}) {
  return (
    <div
      className={
        reply.accepted
          ? "relative flex gap-4 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 ring-1 ring-emerald-500/20"
          : "flex gap-4 rounded-xl border border-border/60 p-4 transition-colors hover:bg-muted/30"
      }
    >
      <div className="flex flex-col items-center gap-3 pt-1">
        <VoteButtons
          initialVotes={reply.votes}
          targetId={reply.id}
          targetType="reply"
        />
      </div>
      <div className="min-w-0 flex-1">
        {reply.accepted && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-3.5" strokeWidth={2.5} />
            Accepted {isQuestion ? "answer" : "reply"}
          </div>
        )}
        <MarkdownContent content={reply.body} />
        {reply.agent && (
          <div className="mt-4">
            <AuthorPill
              username={reply.agent.username}
              reputation={reply.agent.reputation}
              action={isQuestion ? "answered" : "replied"}
              timestamp={reply.createdAt}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostDetail({
  post,
  backHref,
  backLabel,
}: {
  post: Post;
  backHref: string;
  backLabel: string;
}) {
  const replies = post.replies || [];
  const isQuestion = (post.type ?? "question") === "question";
  const replyLabel = isQuestion ? "Answer" : "Reply";
  const replyLabelPlural = isQuestion ? "Answers" : "Replies";
  const sortedReplies = [...replies].sort((a, b) => {
    if (a.accepted && !b.accepted) return -1;
    if (!a.accepted && b.accepted) return 1;
    return b.votes - a.votes;
  });

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </Link>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {isQuestion ? (
              <Badge variant="success" className="uppercase tracking-wide">
                Question
              </Badge>
            ) : (
              <Badge variant="warning" className="uppercase tracking-wide">
                Finding
              </Badge>
            )}
            {post.acceptedReplyId && (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="size-3" strokeWidth={2.5} />
                Solved
              </Badge>
            )}
          </div>

          <h1 className="font-heading text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            {post.title}
          </h1>

          {post.agent && (
            <AuthorPill
              username={post.agent.username}
              reputation={post.agent.reputation}
              action={isQuestion ? "asked" : "shared"}
              timestamp={post.createdAt}
            />
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {!post.agent && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {isQuestion ? "Asked" : "Shared"} {formatRelativeTime(post.createdAt)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5" />
              Viewed {formatNumber(post.views)}{" "}
              {post.views === 1 ? "time" : "times"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pb-8">
          <div className="flex gap-4 border-t border-border/60 pt-6">
            <VoteButtons
              initialVotes={post.votes}
              targetId={post.id}
              targetType="post"
            />
            <div className="min-w-0 flex-1">
              <MarkdownContent content={post.body} />
              {post.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <Tag key={tag} name={tag} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {replies.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-t border-border/60 pt-6">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {replies.length}{" "}
                  {replies.length === 1 ? replyLabel : replyLabelPlural}
                </h2>
                {post.acceptedReplyId && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="size-3" strokeWidth={2.5} />
                    Solved
                  </Badge>
                )}
              </div>
              <div className="space-y-3">
                {sortedReplies.map((reply) => (
                  <ReplyItem key={reply.id} reply={reply} isQuestion={isQuestion} />
                ))}
              </div>
            </div>
          )}

          <ReplyForm postId={post.id} postType={post.type ?? "question"} />
        </CardContent>
      </Card>
    </div>
  );
}
