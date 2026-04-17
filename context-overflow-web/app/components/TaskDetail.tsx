import Link from "next/link";
import type { Task, TaskAttempt, TaskStatus } from "@/lib/data";
import { formatNumber, formatRelativeTime } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import MarkdownContent from "./MarkdownContent";
import Tag from "./Tag";
import TaskStatusControl from "./TaskStatusControl";

type StatusVariant = "info" | "warning" | "success" | "neutral";

const STATUS_VARIANT: Record<string, { label: string; variant: StatusVariant }> = {
  open: { label: "Open", variant: "info" },
  in_progress: { label: "In Progress", variant: "warning" },
  done: { label: "Done", variant: "success" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

const ATTEMPT_VARIANT: Record<
  string,
  { label: string; variant: "success" | "destructive" | "warning" | "neutral" }
> = {
  success: { label: "Success", variant: "success" },
  fail: { label: "Fail", variant: "destructive" },
  blocked: { label: "Blocked", variant: "warning" },
  in_progress: { label: "In Progress", variant: "warning" },
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function TaskDetail({
  task,
  backHref,
  backLabel,
  taskLinkPrefix = "",
}: {
  task: Task;
  backHref: string;
  backLabel: string;
  taskLinkPrefix?: string;
}) {
  const status = STATUS_VARIANT[task.status] ?? STATUS_VARIANT.open;
  const attempts = (task.attempts ?? []) as TaskAttempt[];

  const hasMeta =
    task.definitionOfDone ||
    (task.requiredCapabilities && task.requiredCapabilities.length > 0) ||
    (task.dependencyIds && task.dependencyIds.length > 0) ||
    (task.relatedContextIds && task.relatedContextIds.length > 0);

  return (
    <Card>
      <CardHeader>
        <div>
          <Link
            href={backHref}
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            &larr; {backLabel}
          </Link>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold leading-tight text-foreground">
            {task.title}
          </h1>
          <Badge variant={status.variant} className="uppercase tracking-wide">
            {status.label}
          </Badge>
        </div>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span>Created {formatRelativeTime(task.createdAt)}</span>
          <span>Priority: {PRIORITY_LABELS[task.priority] ?? task.priority}</span>
          {task.updatedAt !== task.createdAt && (
            <span>Updated {formatRelativeTime(task.updatedAt)}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="border-t border-border pt-6">
          <MarkdownContent content={task.description} />
          <div className="mt-4 flex flex-wrap gap-1.5">
            {task.tags.map((tag) => (
              <Tag key={tag} name={tag} />
            ))}
          </div>
          {task.creator && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted p-3 text-sm">
              <div>
                <span className="font-medium text-primary">
                  {task.creator.username}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {formatNumber(task.creator.reputation)} reputation
                </span>
              </div>
            </div>
          )}
        </div>

        {hasMeta && (
          <div className="space-y-4 border-t border-border pt-6">
            {task.definitionOfDone && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                  Definition of Done
                </h3>
                <MarkdownContent content={task.definitionOfDone} />
              </div>
            )}
            {task.requiredCapabilities &&
              task.requiredCapabilities.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                    Required Capabilities
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {task.requiredCapabilities.map((cap) => (
                      <Badge key={cap} variant="neutral">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            {task.dependencyIds && task.dependencyIds.length > 0 && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                  Dependencies
                </h3>
                <ul className="space-y-1">
                  {task.dependencyIds.map((depId) => (
                    <li key={depId}>
                      <Link
                        href={`${taskLinkPrefix}/tasks/${depId}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {depId}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {task.relatedContextIds && task.relatedContextIds.length > 0 && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                  Related Context
                </h3>
                <ul className="space-y-1">
                  {task.relatedContextIds.map((ctxId) => (
                    <li key={ctxId}>
                      <span className="text-sm text-foreground">{ctxId}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {attempts.length > 0 && (
          <div className="border-t border-border pt-6">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Attempts ({attempts.length})
            </h3>
            <div className="space-y-3">
              {attempts.map((a) => {
                const aStatus =
                  ATTEMPT_VARIANT[a.status] ?? ATTEMPT_VARIANT.in_progress;
                return (
                  <div
                    key={a.id}
                    className="rounded-lg border border-border bg-muted p-3"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant={aStatus.variant} className="uppercase tracking-wide">
                        {aStatus.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        by {a.creator?.username ?? "anonymous"} &middot;{" "}
                        {formatRelativeTime(a.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{a.summary}</p>
                    {a.contextIds.length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Context: {a.contextIds.join(", ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-t border-border pt-6">
          <TaskStatusControl
            taskId={task.id}
            currentStatus={task.status as TaskStatus}
          />
        </div>
      </CardContent>
    </Card>
  );
}
