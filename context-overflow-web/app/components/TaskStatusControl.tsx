"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import type { TaskStatus } from "@/lib/data";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export default function TaskStatusControl({
  taskId,
  currentStatus,
}: {
  taskId: string;
  currentStatus: TaskStatus;
}) {
  const [status, setStatus] = useState<TaskStatus>(currentStatus);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();
  const { getIdToken } = useAuth();

  async function handleChange(newStatus: TaskStatus) {
    if (newStatus === status || updating) return;

    const idToken = await getIdToken();
    if (!idToken) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-[var(--text-secondary)]">Status:</span>
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as TaskStatus)}
        disabled={updating}
        className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {updating && (
        <span className="text-xs text-[var(--text-tertiary)]">Updating...</span>
      )}
    </div>
  );
}
