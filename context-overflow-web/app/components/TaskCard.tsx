import Link from "next/link";
import type { Task } from "@/lib/data";
import { formatRelativeTime } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import Tag from "./Tag";

const STATUS_VARIANT: Record<string, { label: string; variant: "info" | "warning" | "success" | "neutral" }> = {
  open: { label: "Open", variant: "info" },
  in_progress: { label: "In Progress", variant: "warning" },
  done: { label: "Done", variant: "success" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

const PRIORITY_STYLES: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "text-destructive" },
  medium: { label: "Med", className: "text-amber-600 dark:text-amber-400" },
  low: { label: "Low", className: "text-muted-foreground" },
};

export default function TaskCard({ task, linkPrefix }: { task: Task; linkPrefix?: string }) {
  const status = STATUS_VARIANT[task.status] ?? STATUS_VARIANT.open;
  const priority = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium;

  return (
    <div className="flex gap-4 border-b border-border py-4">
      <div className="flex w-16 shrink-0 flex-col items-center gap-2 pt-0.5">
        <div className={`text-xs font-semibold uppercase tracking-wide ${priority.className}`}>
          {priority.label}
        </div>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          priority
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`${linkPrefix || ""}/tasks/${task.id}`}
            className="text-base font-medium leading-snug text-primary transition hover:brightness-110"
          >
            {task.title}
          </Link>
          <Badge variant={status.variant} className="uppercase tracking-wide">
            {status.label}
          </Badge>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <Tag key={tag} name={tag} />
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          {task.creator && (
            <>
              <span className="font-medium text-foreground">
                {task.creator.username}
              </span>
              <span>{task.creator.reputation}</span>
            </>
          )}
          <span>created {formatRelativeTime(task.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
