import type { Post } from "@/lib/data";
import { listPosts } from "@/lib/services/posts";
import { semanticSearch } from "@/lib/services/search";
import { getProjectBySlug } from "@/lib/services/projects";
import PostCard from "@/app/components/PostCard";
import EmptyState from "@/app/components/EmptyState";
import Link from "next/link";
import { notFound } from "next/navigation";
import FeedPagination from "@/components/feed-pagination";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

export default async function ProjectFeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; q?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { type: typeParam, q: qParam, page: pageParam } = await searchParams;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const type = typeParam === "question" || typeParam === "finding" ? typeParam : null;
  const query = typeof qParam === "string" ? qParam.trim() : "";
  const isSearch = query.length > 0;
  const page = parsePageParam(pageParam);
  const basePath = `/p/${slug}`;

  if (isSearch) {
    const searchOffset = (page - 1) * SEARCH_PAGE_SIZE;
    const { results, hasMore } = await semanticSearch(
      query,
      SEARCH_PAGE_SIZE,
      type,
      project.id,
      searchOffset,
    );

    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CardTitle className="font-heading text-xl tracking-tight">
                Search results
              </CardTitle>
              {results.length > 0 && (
                <Badge variant="neutral" className="font-mono">
                  {results.length}
                </Badge>
              )}
            </div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {results.length > 0 ? "Ranked by relevance" : "No results"}
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
                  ? `/p/${slug}/tasks/${result.taskId || result.sourceId}`
                  : `/p/${slug}/posts/${result.postId}`;
                return (
                  <div key={`${result.sourceType}-${result.sourceId}-${i}`} className="py-4">
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
            basePath={basePath}
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
      projectId: project.id,
    })) as Post[];
    const hasMore = rawPosts.length > POSTS_PAGE_SIZE;
    const posts = hasMore ? rawPosts.slice(0, POSTS_PAGE_SIZE) : rawPosts;

    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CardTitle className="font-heading text-xl tracking-tight">
                {type === "question" ? "Questions" : "Findings"}
              </CardTitle>
              {posts.length > 0 && (
                <Badge variant="neutral" className="font-mono">
                  {posts.length}
                </Badge>
              )}
            </div>
            <Link href={`/p/${slug}/post`} className={cn(buttonVariants({ size: "sm" }))}>
              New Post
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <EmptyState
              title={`No ${type === "question" ? "questions" : "findings"} yet`}
              description="Be the first to share something with your project."
              action={
                <Link href={`/p/${slug}/post`} className={cn(buttonVariants())}>
                  New Post
                </Link>
              }
              className="border-0 ring-0 shadow-none"
            />
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} linkPrefix={`/p/${slug}`} />)
          )}
          <FeedPagination basePath={basePath} page={page} hasMore={hasMore} type={type} />
        </CardContent>
      </Card>
    );
  }

  const rawPosts = (await listPosts({
    sort: "newest",
    limit: POSTS_PAGE_SIZE + 1,
    offset,
    projectId: project.id,
  })) as Post[];
  const hasMore = rawPosts.length > POSTS_PAGE_SIZE;
  const posts = hasMore ? rawPosts.slice(0, POSTS_PAGE_SIZE) : rawPosts;

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CardTitle className="font-heading text-xl tracking-tight">
              {project.name} Posts
            </CardTitle>
            {posts.length > 0 && (
              <Badge variant="neutral" className="font-mono">
                {posts.length}
              </Badge>
            )}
          </div>
          <Link href={`/p/${slug}/post`} className={cn(buttonVariants({ size: "sm" }))}>
            New Post
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <EmptyState
            title="No posts yet"
            description="Be the first to share something with your project."
            action={
              <Link href={`/p/${slug}/post`} className={cn(buttonVariants())}>
                New Post
              </Link>
            }
            className="border-0 ring-0 shadow-none"
          />
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} linkPrefix={`/p/${slug}`} />)
        )}
        <FeedPagination basePath={basePath} page={page} hasMore={hasMore} type={type} />
      </CardContent>
    </Card>
  );
}
