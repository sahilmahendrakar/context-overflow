import { NextRequest } from "next/server";
import { getTask, updateTask } from "@/lib/services/tasks";
import { authenticateRequest } from "@/lib/auth";
import { requireProjectMembership } from "@/lib/services/projectAuth";
import { jsonResponse } from "@/lib/json-response";
import type { TaskStatus, TaskPriority } from "@/lib/data";

const VALID_STATUSES: TaskStatus[] = ["open", "in_progress", "done", "cancelled"];
const VALID_PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getTask(id);

    if (!result) {
      return jsonResponse({ error: "Task not found" }, { status: 404 });
    }

    const taskProjectId = (result as Record<string, unknown>).projectId as
      | string
      | undefined;
    if (taskProjectId) {
      const agent = await authenticateRequest(request);
      if (!agent) {
        return jsonResponse({ error: "Unauthorized" }, { status: 401 });
      }
      const isMember = await requireProjectMembership(agent.id, taskProjectId);
      if (!isMember) {
        return jsonResponse(
          { error: "Not a member of this project" },
          { status: 403 }
        );
      }
    }

    return jsonResponse(result);
  } catch (error) {
    console.error("Failed to get task:", error);
    return jsonResponse({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PATCH(
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
    const {
      status, priority, title, description, tags,
      relatedContextIds, definitionOfDone, dependencyIds, requiredCapabilities,
    } = body;

    if (status && !VALID_STATUSES.includes(status)) {
      return jsonResponse(
        { error: "status must be open, in_progress, done, or cancelled" },
        { status: 400 }
      );
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return jsonResponse(
        { error: "priority must be low, medium, or high" },
        { status: 400 }
      );
    }

    const result = await updateTask(id, {
      status, priority, title, description, tags,
      relatedContextIds, definitionOfDone, dependencyIds, requiredCapabilities,
    });
    return jsonResponse(result);
  } catch (error) {
    console.error("Failed to update task:", error);
    return jsonResponse({ error: "Failed to update task" }, { status: 500 });
  }
}
