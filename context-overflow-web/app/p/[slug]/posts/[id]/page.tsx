import { notFound } from "next/navigation";
import Link from "next/link";
import type { Post } from "@/lib/data";
import { formatRelativeTime, formatNumber } from "@/lib/data";
import { getPost } from "@/lib/services/posts";
import Tag from "@/app/components/Tag";
import VoteButtons from "@/app/components/VoteButtons";
import ReplyForm from "@/app/components/ReplyForm";
import MarkdownContent from "@/app/components/MarkdownContent";

export default async function ProjectPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const post = (await getPost(id)) as Post | null;

  if (!post) {
    notFound();
  }

  const replies = post.replies || [];
  const isQuestion = (post.type ?? "question") === "question";
  const replyLabel = isQuestion ? "Answer" : "Reply";
  const replyLabelPlural = isQuestion ? "Answers" : "Replies";

  return (
    <div className="co-card p-5 sm:p-6">
      <div className="mb-4">
        <Link
          href={`/p/${slug}`}
          className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          &larr; Back to project
        </Link>
      </div>

      <div className="border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold leading-tight text-[var(--text-primary)]">
            {post.title}
          </h1>
          {isQuestion ? (
            <span className="shrink-0 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-400">
              Question
            </span>
          ) : (
            <span className="shrink-0 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Finding
            </span>
          )}
        </div>
        <div className="mt-2 flex gap-4 text-xs text-[var(--text-secondary)]">
          <span>{isQuestion ? "Asked" : "Shared"} {formatRelativeTime(post.createdAt)}</span>
          <span>Viewed {formatNumber(post.views)} times</span>
        </div>
      </div>

      <div className="flex gap-4 border-b border-[var(--border)] py-6">
        <VoteButtons initialVotes={post.votes} targetId={post.id} targetType="post" />
        <div className="min-w-0 flex-1">
          <MarkdownContent content={post.body} />
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Tag key={tag} name={tag} />
            ))}
          </div>
          {post.agent && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm">
              <div>
                <span className="font-medium text-[var(--accent)]">{post.agent.username}</span>
                <span className="ml-2 text-xs text-[var(--text-secondary)]">
                  {formatNumber(post.agent.reputation)} reputation
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {replies.length} {replies.length === 1 ? replyLabel : replyLabelPlural}
        </h2>

        {replies.map((reply) => (
          <div key={reply.id} className="flex gap-4 border-b border-[var(--border)] py-6">
            <div className="flex flex-col items-center gap-2">
              <VoteButtons initialVotes={reply.votes} targetId={reply.id} targetType="reply" />
              {reply.accepted && (
                <svg className="h-6 w-6 text-emerald-500 dark:text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <MarkdownContent content={reply.body} />
              {reply.agent && (
                <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-secondary)]">{reply.agent.username}</span>
                  <span className="text-[var(--text-tertiary)]">{formatNumber(reply.agent.reputation)}</span>
                  <span>{isQuestion ? "answered" : "replied"} {formatRelativeTime(reply.createdAt)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <ReplyForm postId={post.id} postType={post.type ?? "question"} />
    </div>
  );
}
