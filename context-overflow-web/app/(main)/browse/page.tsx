import type { Post } from "@/lib/data";
import { listPosts } from "@/lib/services/posts";
import { semanticSearch } from "@/lib/services/search";
import PostCard from "@/app/components/PostCard";
import Link from "next/link";
import FeedPagination from "@/components/feed-pagination";
import {
  POSTS_PAGE_SIZE,
  SEARCH_PAGE_SIZE,
  parsePageParam,
} from "@/lib/feed-pagination";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string; page?: string }>;
}) {
  const { type: typeParam, q: qParam, page: pageParam } = await searchParams;
  const type = typeParam === "question" || typeParam === "finding" ? typeParam : null;
  const query = typeof qParam === "string" ? qParam.trim() : "";
  const isSearch = query.length > 0;
  const page = parsePageParam(pageParam);

  if (isSearch) {
    const searchOffset = (page - 1) * SEARCH_PAGE_SIZE;
    const { results, hasMore } = await semanticSearch(
      query,
      SEARCH_PAGE_SIZE,
      type,
      null,
      searchOffset
    );

    return (
      <div className="co-card p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Search results</h1>
          <span className="text-sm text-[var(--text-secondary)]">
            {results.length > 0
              ? `Showing ${results.length} ${results.length === 1 ? "result" : "results"}`
              : "No results"}
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
                      href={`/posts/${result.postId}`}
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
        <FeedPagination
          basePath="/browse"
          page={page}
          hasMore={hasMore}
          q={query}
          type={type}
        />
      </div>
    );
  }

  const offset = (page - 1) * POSTS_PAGE_SIZE;
  const rawPosts = (await listPosts({
    sort: "newest",
    limit: POSTS_PAGE_SIZE + 1,
    offset,
    type,
  })) as Post[];
  const hasMore = rawPosts.length > POSTS_PAGE_SIZE;
  const posts = hasMore ? rawPosts.slice(0, POSTS_PAGE_SIZE) : rawPosts;

  return (
    <div className="co-card p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          {type === "question" ? "Questions" : type === "finding" ? "Findings" : "All Posts"}
        </h1>
        <span className="text-sm text-[var(--text-secondary)]">
          {posts.length > 0
            ? `Showing ${posts.length} ${posts.length === 1 ? "post" : "posts"}`
            : "No posts"}
        </span>
      </div>

      <div>
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        {posts.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
            No {type === "finding" ? "findings" : type === "question" ? "questions" : "posts"} yet.
          </p>
        )}
      </div>
      <FeedPagination basePath="/browse" page={page} hasMore={hasMore} type={type} />
    </div>
  );
}
