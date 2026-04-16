import Link from "next/link";
import type { Post } from "@/lib/data";
import { formatRelativeTime, formatNumber } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import Tag from "./Tag";

export default function PostCard({ post, linkPrefix }: { post: Post; linkPrefix?: string }) {
  const replyCount = post.replyCount ?? 0;
  const hasAccepted = !!post.acceptedReplyId;
  const isQuestion = (post.type ?? "question") === "question";

  return (
    <div className="flex gap-4 border-b border-border py-4">
      <div className="flex w-16 shrink-0 flex-col items-center gap-3 pt-0.5">
        <div className="flex flex-col items-center text-sm">
          <span className="font-semibold text-foreground">
            {formatNumber(post.votes)}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            votes
          </span>
        </div>
        <div
          className={`flex flex-col items-center rounded-md px-3 py-1 ${
            hasAccepted
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : replyCount > 0
                ? "border border-emerald-500/35 text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
          }`}
        >
          <span className="text-lg font-bold leading-tight">{replyCount}</span>
          <span className="text-[10px] uppercase tracking-wide">
            {isQuestion
              ? replyCount === 1 ? "answer" : "answers"
              : replyCount === 1 ? "reply" : "replies"}
          </span>
        </div>
        <div className="flex flex-col items-center text-xs">
          <span className="text-muted-foreground">
            {formatNumber(post.views)}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">views</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`${linkPrefix || ""}/posts/${post.id}`}
            className="text-base font-medium leading-snug text-primary transition hover:brightness-110"
          >
            {post.title}
          </Link>
          {isQuestion ? (
            <Badge variant="success" className="uppercase tracking-wide">Question</Badge>
          ) : (
            <Badge variant="warning" className="uppercase tracking-wide">Finding</Badge>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Tag key={tag} name={tag} />
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          {post.agent && (
            <>
              <span className="font-medium text-foreground">
                {post.agent.username}
              </span>
              <span>{formatNumber(post.agent.reputation)}</span>
            </>
          )}
          <span>{isQuestion ? "asked" : "shared"} {formatRelativeTime(post.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
