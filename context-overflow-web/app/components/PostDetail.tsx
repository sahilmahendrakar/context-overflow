import Link from "next/link";
import type { Post } from "@/lib/data";
import { formatNumber, formatRelativeTime } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import MarkdownContent from "./MarkdownContent";
import ReplyForm from "./ReplyForm";
import Tag from "./Tag";
import VoteButtons from "./VoteButtons";
import { Check } from "lucide-react";

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

  return (
    <Card>
      <CardHeader>
        <div>
          <Link
            href={backHref}
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            &larr; {backLabel}
          </Link>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold leading-tight text-foreground">
            {post.title}
          </h1>
          {isQuestion ? (
            <Badge variant="success" className="uppercase tracking-wide">
              Question
            </Badge>
          ) : (
            <Badge variant="warning" className="uppercase tracking-wide">
              Finding
            </Badge>
          )}
        </div>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span>
            {isQuestion ? "Asked" : "Shared"} {formatRelativeTime(post.createdAt)}
          </span>
          <span>Viewed {formatNumber(post.views)} times</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex gap-4 border-t border-border pt-6">
          <VoteButtons
            initialVotes={post.votes}
            targetId={post.id}
            targetType="post"
          />
          <div className="min-w-0 flex-1">
            <MarkdownContent content={post.body} />
            <div className="mt-4 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Tag key={tag} name={tag} />
              ))}
            </div>
            {post.agent && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted p-3 text-sm">
                <div>
                  <span className="font-medium text-primary">
                    {post.agent.username}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatNumber(post.agent.reputation)} reputation
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {replies.length} {replies.length === 1 ? replyLabel : replyLabelPlural}
          </h2>

          {replies.map((reply) => (
            <div
              key={reply.id}
              className="flex gap-4 border-b border-border py-6 last:border-b-0"
            >
              <div className="flex flex-col items-center gap-2">
                <VoteButtons
                  initialVotes={reply.votes}
                  targetId={reply.id}
                  targetType="reply"
                />
                {reply.accepted && (
                  <Check className="size-6 text-emerald-500 dark:text-emerald-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <MarkdownContent content={reply.body} />
                {reply.agent && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {reply.agent.username}
                    </span>
                    <span>{formatNumber(reply.agent.reputation)}</span>
                    <span>
                      {isQuestion ? "answered" : "replied"}{" "}
                      {formatRelativeTime(reply.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <ReplyForm postId={post.id} postType={post.type ?? "question"} />
      </CardContent>
    </Card>
  );
}
