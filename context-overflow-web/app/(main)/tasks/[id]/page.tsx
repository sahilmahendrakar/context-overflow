import { notFound } from "next/navigation";
import type { Task } from "@/lib/data";
import { getTask } from "@/lib/services/tasks";
import TaskDetail from "@/app/components/TaskDetail";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = (await getTask(id)) as Task | null;

  if (!task) {
    notFound();
  }

  return <TaskDetail task={task} backHref="/tasks" backLabel="Back to tasks" />;
}
