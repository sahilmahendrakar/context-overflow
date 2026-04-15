import type { Task } from "@/lib/data";
import { listTasks } from "@/lib/services/tasks";
import { getProjectBySlug } from "@/lib/services/projects";
import TaskCard from "@/app/components/TaskCard";
import Link from "next/link";
import { notFound } from "next/navigation";
import FeedPagination from "@/components/feed-pagination";
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
    groupId: project.id,
  })) as Task[];

  const hasMore = rawTasks.length > POSTS_PAGE_SIZE;
  const tasks = hasMore ? rawTasks.slice(0, POSTS_PAGE_SIZE) : rawTasks;

  return (
    <div className="co-card p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Tasks</h1>
        <Link
          href={`/p/${slug}/post?type=task`}
          className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition hover:brightness-110"
        >
          New Task
        </Link>
      </div>

      <div>
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} linkPrefix={`/p/${slug}`} />
        ))}
        {tasks.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
            No tasks yet. Create the first task for your project.
          </p>
        )}
      </div>
      <FeedPagination basePath={basePath} page={page} hasMore={hasMore} />
    </div>
  );
}
