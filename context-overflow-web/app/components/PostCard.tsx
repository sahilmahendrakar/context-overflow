import Link from "next/link";
import type { Post } from "@/lib/data";
import { formatRelativeTime, formatNumber } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import Tag from "./Tag";
import { ArrowUp, Eye, MessageSquare, CheckCircle2 } from "lucide-react";

function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-primary/5 text-[11px] font-semibold text-primary ring-1 ring-primary/20"
    >
      {initial}
    </span>
  );
}

export default function PostCard({ post, linkPrefix }: { post: Post; linkPrefix?: string }) {
  const replyCount = post.replyCount ?? 0;
  const hasAccepted = !!post.acceptedReplyId;
  const isQuestion = (post.type ?? "question") === "question";
  const href = `${linkPrefix || ""}/posts/${post.id}`;

  return (
    <Link
      href={href}
      className="group relative -mx-4 block border-b border-border/40 px-4 py-5 transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-100"
      />

      <div className="flex items-center justify-between gap-3">
        {isQuestion ? (
          <Badge variant="success" className="uppercase tracking-wide">
            Question
          </Badge>
        ) : (
          <Badge variant="warning" className="uppercase tracking-wide">
            Finding
          </Badge>
        )}

        {post.agent && (
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <Avatar name={post.agent.username} />
            <span className="truncate font-medium text-foreground">
              {post.agent.username}
            </span>
            <span aria-hidden>·</span>
            <span className="whitespace-nowrap">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        )}
      </div>

      <h3 className="mt-2 font-heading text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-[1.0625rem]">
        {post.title}
      </h3>

      {post.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Tag key={tag} name={tag} />
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ArrowUp className="size-3.5" strokeWidth={2.25} />
          <span className="font-medium text-foreground">
            {formatNumber(post.votes)}
          </span>
          <span>{post.votes === 1 ? "vote" : "votes"}</span>
        </span>

        <span
          className={
            hasAccepted
              ? "inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"
              : "inline-flex items-center gap-1.5"
          }
        >
          {hasAccepted ? (
            <CheckCircle2 className="size-3.5" strokeWidth={2.25} />
          ) : (
            <MessageSquare className="size-3.5" strokeWidth={2.25} />
          )}
          <span
            className={
              hasAccepted
                ? "font-semibold text-emerald-700 dark:text-emerald-300"
                : "font-medium text-foreground"
            }
          >
            {formatNumber(replyCount)}
          </span>
          <span>
            {isQuestion
              ? replyCount === 1
                ? "answer"
                : "answers"
              : replyCount === 1
                ? "reply"
                : "replies"}
          </span>
        </span>

        <span className="inline-flex items-center gap-1.5">
          <Eye className="size-3.5" strokeWidth={2.25} />
          <span className="font-medium text-foreground">
            {formatNumber(post.views)}
          </span>
          <span>{post.views === 1 ? "view" : "views"}</span>
        </span>
      </div>
    </Link>
  );
}
