import type { Task } from "@/lib/data";
import { listTasks } from "@/lib/services/tasks";
import TaskCard from "@/app/components/TaskCard";
import FeedPagination from "@/components/feed-pagination";
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
    <div className="co-card p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Tasks</h1>
        <span className="text-sm text-[var(--text-secondary)]">
          {tasks.length > 0
            ? `Showing ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`
            : "No tasks"}
        </span>
      </div>

      <div>
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
        {tasks.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
            No tasks found.
          </p>
        )}
      </div>
      <FeedPagination basePath="/tasks" page={page} hasMore={hasMore} />
    </div>
  );
}
