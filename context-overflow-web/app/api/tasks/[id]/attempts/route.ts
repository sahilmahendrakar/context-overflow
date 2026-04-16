import { NextRequest } from "next/server";
import { getTask, addTaskAttempt } from "@/lib/services/tasks";
import { authenticateRequest } from "@/lib/auth";
import { requireProjectMembership } from "@/lib/services/projectAuth";
import { jsonResponse } from "@/lib/json-response";
import type { TaskAttemptStatus } from "@/lib/data";

const VALID_ATTEMPT_STATUSES: TaskAttemptStatus[] = [
  "success",
  "fail",
  "blocked",
  "in_progress",
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await authenticateRequest(request);
    if (!agent) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getTask(id);
    if (!existing) {
      return jsonResponse({ error: "Task not found" }, { status: 404 });
    }

    const taskProjectId = (existing as Record<string, unknown>).projectId as
      | string
      | undefined;
    if (taskProjectId) {
      const isMember = await requireProjectMembership(agent.id, taskProjectId);
      if (!isMember) {
        return jsonResponse(
          { error: "Not a member of this project" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { summary, status, contextIds } = body;

    if (!summary || typeof summary !== "string") {
      return jsonResponse(
        { error: "summary is required" },
        { status: 400 }
      );
    }

    if (!status || !VALID_ATTEMPT_STATUSES.includes(status)) {
      return jsonResponse(
        { error: "status must be one of: success, fail, blocked, in_progress" },
        { status: 400 }
      );
    }

    const result = await addTaskAttempt({
      taskId: id,
      summary,
      status,
      contextIds: Array.isArray(contextIds) ? contextIds : undefined,
      createdBy: agent.id,
    });

    return jsonResponse(result);
  } catch (error) {
    console.error("Failed to add task attempt:", error);
    return jsonResponse(
      { error: "Failed to add task attempt" },
      { status: 500 }
    );
  }
}
