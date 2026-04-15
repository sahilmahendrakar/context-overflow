import { NextRequest } from "next/server";
import { listTasks, createTask } from "@/lib/services/tasks";
import { authenticateRequest } from "@/lib/auth";
import { userDocumentExists } from "@/lib/agent-resolution";
import { requireProjectMembership } from "@/lib/services/projectAuth";
import { jsonResponse } from "@/lib/json-response";
import type { TaskStatus, TaskPriority } from "@/lib/data";

const VALID_STATUSES: TaskStatus[] = ["open", "in_progress", "done", "cancelled"];
const VALID_PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (groupId) {
      const agent = await authenticateRequest(request);
      if (!agent) {
        return jsonResponse({ error: "Unauthorized" }, { status: 401 });
      }
      const isMember = await requireProjectMembership(agent.id, groupId);
      if (!isMember) {
        return jsonResponse(
          { error: "Not a member of this project" },
          { status: 403 }
        );
      }
    }

    const statusParam = searchParams.get("status") as TaskStatus | null;
    const priorityParam = searchParams.get("priority") as TaskPriority | null;

    const result = await listTasks({
      sort: searchParams.get("sort") || "newest",
      limit: Math.min(parseInt(searchParams.get("limit") || "20"), 100),
      offset: parseInt(searchParams.get("offset") || "0"),
      status: statusParam && VALID_STATUSES.includes(statusParam) ? statusParam : null,
      priority: priorityParam && VALID_PRIORITIES.includes(priorityParam) ? priorityParam : null,
      groupId,
    });
    return jsonResponse(result);
  } catch (error) {
    console.error("Failed to list tasks:", error);
    return jsonResponse({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const agent = await authenticateRequest(request);
    if (!agent) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await userDocumentExists(agent.id))) {
      return jsonResponse({ error: "User not found" }, { status: 400 });
    }

    const body = await request.json();
    const {
      title, description, priority, tags, groupId,
      relatedContextIds, definitionOfDone, dependencyIds, requiredCapabilities,
    } = body;

    if (!title || !description) {
      return jsonResponse(
        { error: "title and description are required" },
        { status: 400 }
      );
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return jsonResponse(
        { error: "priority must be low, medium, or high" },
        { status: 400 }
      );
    }

    if (groupId) {
      const isMember = await requireProjectMembership(agent.id, groupId);
      if (!isMember) {
        return jsonResponse(
          { error: "Not a member of this project" },
          { status: 403 }
        );
      }
    }

    const result = await createTask({
      title,
      description,
      priority,
      tags,
      createdBy: agent.id,
      groupId,
      relatedContextIds,
      definitionOfDone,
      dependencyIds,
      requiredCapabilities,
    });
    return jsonResponse(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return jsonResponse({ error: "Failed to create task" }, { status: 500 });
  }
}
