import { notFound } from "next/navigation";
import Link from "next/link";
import type { Task, TaskStatus, TaskAttempt } from "@/lib/data";
import { formatRelativeTime, formatNumber } from "@/lib/data";
import { getTask } from "@/lib/services/tasks";
import Tag from "@/app/components/Tag";
import MarkdownContent from "@/app/components/MarkdownContent";
import TaskStatusControl from "@/app/components/TaskStatusControl";

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  open: {
    label: "Open",
    classes: "border-blue-500/35 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  in_progress: {
    label: "In Progress",
    classes: "border-yellow-500/35 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  },
  done: {
    label: "Done",
    classes: "border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    classes: "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-tertiary)]",
  },
};

const ATTEMPT_STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  success: {
    label: "Success",
    classes: "border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  fail: {
    label: "Fail",
    classes: "border-red-500/35 bg-red-500/10 text-red-600 dark:text-red-400",
  },
  blocked: {
    label: "Blocked",
    classes: "border-orange-500/35 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  in_progress: {
    label: "In Progress",
    classes: "border-yellow-500/35 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  },
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

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

  const status = STATUS_STYLES[task.status] ?? STATUS_STYLES.open;
  const attempts = (task.attempts ?? []) as TaskAttempt[];

  return (
    <div className="co-card p-5 sm:p-6">
      <div className="mb-4">
        <Link
          href="/tasks"
          className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          &larr; Back to tasks
        </Link>
      </div>

      <div className="border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold leading-tight text-[var(--text-primary)]">
            {task.title}
          </h1>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${status.classes}`}>
            {status.label}
          </span>
        </div>
        <div className="mt-2 flex gap-4 text-xs text-[var(--text-secondary)]">
          <span>Created {formatRelativeTime(task.createdAt)}</span>
          <span>Priority: {PRIORITY_LABELS[task.priority] ?? task.priority}</span>
          {task.updatedAt !== task.createdAt && (
            <span>Updated {formatRelativeTime(task.updatedAt)}</span>
          )}
        </div>
      </div>

      <div className="border-b border-[var(--border)] py-6">
        <div className="min-w-0 flex-1">
          <MarkdownContent content={task.description} />
          <div className="mt-4 flex flex-wrap gap-1.5">
            {task.tags.map((tag) => (
              <Tag key={tag} name={tag} />
            ))}
          </div>
          {task.creator && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm">
              <div>
                <span className="font-medium text-[var(--accent)]">
                  {task.creator.username}
                </span>
                <span className="ml-2 text-xs text-[var(--text-secondary)]">
                  {formatNumber(task.creator.reputation)} reputation
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {(task.definitionOfDone || (task.requiredCapabilities && task.requiredCapabilities.length > 0) || (task.dependencyIds && task.dependencyIds.length > 0) || (task.relatedContextIds && task.relatedContextIds.length > 0)) && (
        <div className="border-b border-[var(--border)] py-6 space-y-4">
          {task.definitionOfDone && (
            <div>
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Definition of Done</h3>
              <MarkdownContent content={task.definitionOfDone} />
            </div>
          )}
          {task.requiredCapabilities && task.requiredCapabilities.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Required Capabilities</h3>
              <div className="flex flex-wrap gap-1.5">
                {task.requiredCapabilities.map((cap) => (
                  <span key={cap} className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}
          {task.dependencyIds && task.dependencyIds.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Dependencies</h3>
              <ul className="space-y-1">
                {task.dependencyIds.map((depId) => (
                  <li key={depId}>
                    <Link href={`/tasks/${depId}`} className="text-sm text-[var(--accent)] hover:underline">
                      {depId}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {task.relatedContextIds && task.relatedContextIds.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Related Context</h3>
              <ul className="space-y-1">
                {task.relatedContextIds.map((ctxId) => (
                  <li key={ctxId}>
                    <span className="text-sm text-[var(--text-primary)]">{ctxId}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {attempts.length > 0 && (
        <div className="border-b border-[var(--border)] py-6">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
            Attempts ({attempts.length})
          </h3>
          <div className="space-y-3">
            {attempts.map((a) => {
              const aStatus = ATTEMPT_STATUS_STYLES[a.status] ?? ATTEMPT_STATUS_STYLES.in_progress;
              return (
                <div key={a.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${aStatus.classes}`}>
                      {aStatus.label}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      by {a.creator?.username ?? "anonymous"} &middot; {formatRelativeTime(a.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)]">{a.summary}</p>
                  {a.contextIds.length > 0 && (
                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                      Context: {a.contextIds.join(", ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6">
        <TaskStatusControl taskId={task.id} currentStatus={task.status as TaskStatus} />
      </div>
    </div>
  );
}
