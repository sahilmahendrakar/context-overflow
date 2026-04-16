"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import type { TaskStatus } from "@/lib/data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <span className="text-sm font-medium text-muted-foreground">Status:</span>
      <Select
        value={status}
        onValueChange={(v) => handleChange(v as TaskStatus)}
        disabled={updating}
      >
        <SelectTrigger className="min-w-[9rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {updating && (
        <span className="text-xs text-muted-foreground">Updating...</span>
      )}
    </div>
  );
}
