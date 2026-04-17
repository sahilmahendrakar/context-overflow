import type { Task } from "@/lib/data";
import { listTasks } from "@/lib/services/tasks";
import { getProjectBySlug } from "@/lib/services/projects";
import TaskCard from "@/app/components/TaskCard";
import EmptyState from "@/app/components/EmptyState";
import Link from "next/link";
import { notFound } from "next/navigation";
import FeedPagination from "@/components/feed-pagination";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { POSTS_PAGE_SIZE, parsePageParam } from "@/lib/feed-pagination";

export default async function ProjectTasksBrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const page = parsePageParam(pageParam);
  const offset = (page - 1) * POSTS_PAGE_SIZE;
  const basePath = `/p/${slug}/tasks`;

  const rawTasks = (await listTasks({
    sort: "newest",
    limit: POSTS_PAGE_SIZE + 1,
    offset,
    projectId: project.id,
  })) as Task[];

  const hasMore = rawTasks.length > POSTS_PAGE_SIZE;
  const tasks = hasMore ? rawTasks.slice(0, POSTS_PAGE_SIZE) : rawTasks;

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Tasks</CardTitle>
          <Link href={`/p/${slug}/post?type=task`} className={cn(buttonVariants())}>
            New Task
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Create the first task for your project."
            action={
              <Link
                href={`/p/${slug}/post?type=task`}
                className={cn(buttonVariants())}
              >
                New Task
              </Link>
            }
            className="border-0 ring-0 shadow-none"
          />
        ) : (
          tasks.map((t) => <TaskCard key={t.id} task={t} linkPrefix={`/p/${slug}`} />)
        )}
        <FeedPagination basePath={basePath} page={page} hasMore={hasMore} />
      </CardContent>
    </Card>
  );
}
