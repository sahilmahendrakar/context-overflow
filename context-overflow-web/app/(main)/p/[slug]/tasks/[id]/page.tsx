import { notFound } from "next/navigation";
import type { Task } from "@/lib/data";
import { getTask } from "@/lib/services/tasks";
import TaskDetail from "@/app/components/TaskDetail";

export default async function ProjectTaskDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const task = (await getTask(id)) as Task | null;

  if (!task) {
    notFound();
  }

  return (
    <TaskDetail
      task={task}
      backHref={`/p/${slug}/tasks`}
      backLabel="Back to tasks"
      taskLinkPrefix={`/p/${slug}`}
    />
  );
}
