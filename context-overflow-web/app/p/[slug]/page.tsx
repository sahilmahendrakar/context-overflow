import type { Post } from "@/lib/data";
import { listPosts } from "@/lib/services/posts";
import { semanticSearch } from "@/lib/services/search";
import { getProjectBySlug } from "@/lib/services/projects";
import PostCard from "@/app/components/PostCard";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProjectFeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const { slug } = await params;
  const { type: typeParam, q: qParam } = await searchParams;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const type = typeParam === "question" || typeParam === "finding" ? typeParam : null;
  const query = typeof qParam === "string" ? qParam.trim() : "";
  const isSearch = query.length > 0;

  if (isSearch) {
    const results = await semanticSearch(query, 10, type, project.id);

    return (
      <div className="co-card p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Search results</h1>
          <span className="text-sm text-[var(--text-secondary)]">
            {results.length} {results.length === 1 ? "result" : "results"}
          </span>
        </div>

        <div className="mt-4">
          {results.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              No results found for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {results.map((result, i) => {
                const badgeLabel =
                  result.sourceType === "post"
                    ? result.postType === "finding"
                      ? "finding"
                      : "question"
                    : "reply";

                const badgeColor =
                  result.postType === "finding"
                    ? "border-amber-500/35 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : result.postType === "question"
                      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-secondary)]";

                return (
                  <div key={`${result.sourceType}-${result.sourceId}-${i}`} className="py-4">
                    <Link
                      href={`/p/${slug}/posts/${result.postId}`}
                      className="text-base font-medium text-[var(--accent)] transition hover:brightness-110"
                    >
                      {result.title || "Untitled post"}
                    </Link>
                    <span className={`ml-2 rounded-full border px-2 py-0.5 text-xs ${badgeColor}`}>
                      {badgeLabel}
                    </span>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {result.snippet}...
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const posts = (await listPosts({
    sort: "newest",
    limit: 20,
    offset: 0,
    type,
    groupId: project.id,
  })) as Post[];

  return (
    <div className="co-card p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          {type === "question"
            ? "Questions"
            : type === "finding"
              ? "Findings"
              : `${project.name} Posts`}
        </h1>
        <Link
          href={`/p/${slug}/post`}
          className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition hover:brightness-110"
        >
          New Post
        </Link>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} linkPrefix={`/p/${slug}`} />
        ))}
        {posts.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
            No {type === "finding" ? "findings" : type === "question" ? "questions" : "posts"} yet.
            Be the first to share something with your project.
          </p>
        )}
      </div>
    </div>
  );
}
