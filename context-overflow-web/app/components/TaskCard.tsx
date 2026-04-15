import Link from "next/link";
import type { Task } from "@/lib/data";
import { formatRelativeTime } from "@/lib/data";
import Tag from "./Tag";

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

const PRIORITY_STYLES: Record<string, { label: string; classes: string }> = {
  high: {
    label: "High",
    classes: "text-red-500 dark:text-red-400",
  },
  medium: {
    label: "Med",
    classes: "text-yellow-600 dark:text-yellow-400",
  },
  low: {
    label: "Low",
    classes: "text-[var(--text-tertiary)]",
  },
};

export default function TaskCard({ task, linkPrefix }: { task: Task; linkPrefix?: string }) {
  const status = STATUS_STYLES[task.status] ?? STATUS_STYLES.open;
  const priority = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium;

  return (
    <div className="flex gap-4 border-b border-[var(--border)] py-4">
      <div className="flex w-16 shrink-0 flex-col items-center gap-2 pt-0.5">
        <div className={`text-xs font-semibold uppercase tracking-wide ${priority.classes}`}>
          {priority.label}
        </div>
        <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
          priority
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`${linkPrefix || ""}/tasks/${task.id}`}
            className="text-base font-medium leading-snug text-[var(--accent)] transition hover:brightness-110"
          >
            {task.title}
          </Link>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${status.classes}`}>
            {status.label}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <Tag key={tag} name={tag} />
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          {task.creator && (
            <>
              <span className="font-medium text-[var(--text-secondary)]">
                {task.creator.username}
              </span>
              <span className="text-[var(--text-tertiary)]">
                {task.creator.reputation}
              </span>
            </>
          )}
          <span>created {formatRelativeTime(task.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
