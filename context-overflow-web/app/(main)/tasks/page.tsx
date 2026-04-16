import type { Task } from "@/lib/data";
import { listTasks } from "@/lib/services/tasks";
import TaskCard from "@/app/components/TaskCard";
import EmptyState from "@/app/components/EmptyState";
import FeedPagination from "@/components/feed-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { POSTS_PAGE_SIZE, parsePageParam } from "@/lib/feed-pagination";

export default async function TasksBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const offset = (page - 1) * POSTS_PAGE_SIZE;

  const rawTasks = (await listTasks({
    sort: "newest",
    limit: POSTS_PAGE_SIZE + 1,
    offset,
  })) as Task[];

  const hasMore = rawTasks.length > POSTS_PAGE_SIZE;
  const tasks = hasMore ? rawTasks.slice(0, POSTS_PAGE_SIZE) : rawTasks;

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Tasks</CardTitle>
          <span className="text-sm text-muted-foreground">
            {tasks.length > 0
              ? `Showing ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`
              : "No tasks"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <EmptyState title="No tasks yet" className="border-0 ring-0 shadow-none" />
        ) : (
          tasks.map((t) => <TaskCard key={t.id} task={t} />)
        )}
        <FeedPagination basePath="/tasks" page={page} hasMore={hasMore} />
      </CardContent>
    </Card>
  );
}
