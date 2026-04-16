import type { Post } from "@/lib/data";
import { listPosts } from "@/lib/services/posts";
import { semanticSearch } from "@/lib/services/search";
import PostCard from "@/app/components/PostCard";
import EmptyState from "@/app/components/EmptyState";
import Link from "next/link";
import FeedPagination from "@/components/feed-pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  POSTS_PAGE_SIZE,
  SEARCH_PAGE_SIZE,
  parsePageParam,
} from "@/lib/feed-pagination";

function searchBadgeVariant(
  postType: "question" | "finding" | "task" | undefined,
  sourceType: string,
): "success" | "warning" | "info" | "neutral" {
  if (postType === "task") return "info";
  if (postType === "finding") return "warning";
  if (sourceType === "post") return "success";
  return "neutral";
}

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
      searchOffset,
    );

    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Search results</CardTitle>
            <span className="text-sm text-muted-foreground">
              {results.length > 0
                ? `Showing ${results.length} ${results.length === 1 ? "result" : "results"}`
                : "No results"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {results.map((result, i) => {
                const isTask = result.postType === "task";
                const badgeLabel = isTask
                  ? "task"
                  : result.sourceType === "post"
                    ? result.postType === "finding"
                      ? "finding"
                      : "question"
                    : "reply";
                const href = isTask
                  ? `/tasks/${result.taskId || result.sourceId}`
                  : `/posts/${result.postId}`;
                return (
                  <div
                    key={`${result.sourceType}-${result.sourceId}-${i}`}
                    className="py-4"
                  >
                    <div className="flex items-center gap-2">
                      <Link
                        href={href}
                        className="text-base font-medium text-primary transition hover:brightness-110"
                      >
                        {result.title || (isTask ? "Untitled task" : "Untitled post")}
                      </Link>
                      <Badge variant={searchBadgeVariant(result.postType, result.sourceType)}>
                        {badgeLabel}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {result.snippet}...
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          <FeedPagination
            basePath="/browse"
            page={page}
            hasMore={hasMore}
            q={query}
            type={type}
          />
        </CardContent>
      </Card>
    );
  }

  const offset = (page - 1) * POSTS_PAGE_SIZE;

  if (type === "question" || type === "finding") {
    const rawPosts = (await listPosts({
      sort: "newest",
      limit: POSTS_PAGE_SIZE + 1,
      offset,
      type,
    })) as Post[];
    const hasMore = rawPosts.length > POSTS_PAGE_SIZE;
    const posts = hasMore ? rawPosts.slice(0, POSTS_PAGE_SIZE) : rawPosts;

    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {type === "question" ? "Questions" : "Findings"}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {posts.length > 0
                ? `Showing ${posts.length} ${posts.length === 1 ? "post" : "posts"}`
                : "No posts"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <EmptyState
              title={`No ${type === "question" ? "questions" : "findings"} yet`}
              className="border-0 ring-0 shadow-none"
            />
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          )}
          <FeedPagination basePath="/browse" page={page} hasMore={hasMore} type={type} />
        </CardContent>
      </Card>
    );
  }

  const rawPosts = (await listPosts({
    sort: "newest",
    limit: POSTS_PAGE_SIZE + 1,
    offset,
  })) as Post[];
  const hasMore = rawPosts.length > POSTS_PAGE_SIZE;
  const posts = hasMore ? rawPosts.slice(0, POSTS_PAGE_SIZE) : rawPosts;

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">All Posts</CardTitle>
          <span className="text-sm text-muted-foreground">
            {posts.length > 0
              ? `Showing ${posts.length} ${posts.length === 1 ? "post" : "posts"}`
              : "No posts"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <EmptyState title="No posts yet" className="border-0 ring-0 shadow-none" />
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} />)
        )}
        <FeedPagination basePath="/browse" page={page} hasMore={hasMore} type={type} />
      </CardContent>
    </Card>
  );
}
