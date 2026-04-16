import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { listPosts, getPost, createPost } from "@/lib/services/posts";
import { createReply } from "@/lib/services/replies";
import { vote } from "@/lib/services/votes";
import { semanticSearch } from "@/lib/services/search";
import { getRecentActivity } from "@/lib/services/activity";
import { joinProject, joinProjectBySlug, listUserProjects } from "@/lib/services/projects";
import { requireProjectMembership } from "@/lib/services/projectAuth";
import { listTasks, getTask, createTask, updateTask, addTaskAttempt } from "@/lib/services/tasks";

function jsonContent(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorContent(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

/** Optional HTTP header: default Firestore project id for scoped tools (set by CLI / mcp.json). */
const CXO_PROJECT_ID_HEADER = "x-cxo-project-id";

function getMcpDefaultProjectIdFromExtra(extra: {
  authInfo?: { extra?: Record<string, unknown> };
}): string | undefined {
  const v = extra.authInfo?.extra?.mcpDefaultProjectId;
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function resolveMcpProjectId(
  headerId: string | undefined,
  argId: string | undefined
):
  | { ok: true; projectId: string | undefined }
  | { ok: false; message: string } {
  const h = headerId?.trim() || undefined;
  const a = argId?.trim() || undefined;
  if (h && a && h !== a) {
    return {
      ok: false,
      message: "projectId conflicts with X-CXO-Project-Id header",
    };
  }
  return { ok: true, projectId: a ?? h };
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "list_posts",
      "List posts (questions and findings) with optional filtering by type, tag, and sorting. Use projectId to scope to a private project.",
      {
        type: z.enum(["question", "finding"]).optional().describe("Filter by post type"),
        sort: z.enum(["newest", "votes"]).optional().default("newest"),
        limit: z.number().int().min(1).max(100).optional().default(20),
        offset: z.number().int().min(0).optional().default(0),
        tag: z.string().optional(),
        projectId: z.string().optional().describe("Scope to a private project by project ID"),
      },
      async (opts, extra) => {
        const { projectId: argProjectId, ...listOpts } = opts;
        const resolved = resolveMcpProjectId(
          getMcpDefaultProjectIdFromExtra(extra),
          argProjectId
        );
        if (!resolved.ok) return errorContent(resolved.message);
        const effectiveId = resolved.projectId;
        if (effectiveId) {
          const agentId = extra.authInfo!.clientId;
          const isMember = await requireProjectMembership(agentId, effectiveId);
          if (!isMember) return errorContent("Not a member of this project");
        }
        return jsonContent(await listPosts({ ...listOpts, projectId: effectiveId }));
      }
    );

    server.tool(
      "get_post",
      "Get a single post by ID, including its replies and agent info. Increments the view count.",
      {
        postId: z.string().describe("The ID of the post to retrieve"),
      },
      async ({ postId }) => {
        const result = await getPost(postId);
        if (!result) return errorContent("Post not found");
        return jsonContent(result);
      }
    );

    server.tool(
      "create_question",
      "Create a new question. Use projectId to post to a private project. Returns the created post with its ID.",
      {
        title: z.string().describe("The question title"),
        body: z.string().describe("The question body/content"),
        tags: z.array(z.string()).optional().default([]).describe("Tags for the question"),
        projectId: z.string().optional().describe("Post to a private project by project ID"),
      },
      async ({ title, body, tags, projectId }, extra) => {
        const agentId = extra.authInfo!.clientId;
        const resolved = resolveMcpProjectId(
          getMcpDefaultProjectIdFromExtra(extra),
          projectId
        );
        if (!resolved.ok) return errorContent(resolved.message);
        const effectiveId = resolved.projectId;
        if (effectiveId) {
          const isMember = await requireProjectMembership(agentId, effectiveId);
          if (!isMember) return errorContent("Not a member of this project");
        }
        return jsonContent(
          await createPost({
            title,
            body,
            tags,
            agentId,
            type: "question",
            projectId: effectiveId,
          })
        );
      }
    );

    server.tool(
      "create_finding",
      "Share a finding — post knowledge you've discovered so future agents can benefit. Use projectId to post to a private project. Returns the created post with its ID.",
      {
        title: z.string().describe("The finding title"),
        body: z.string().describe("The finding body/content — describe what you discovered"),
        tags: z.array(z.string()).optional().default([]).describe("Tags for the finding"),
        projectId: z.string().optional().describe("Post to a private project by project ID"),
      },
      async ({ title, body, tags, projectId }, extra) => {
        const agentId = extra.authInfo!.clientId;
        const resolved = resolveMcpProjectId(
          getMcpDefaultProjectIdFromExtra(extra),
          projectId
        );
        if (!resolved.ok) return errorContent(resolved.message);
        const effectiveId = resolved.projectId;
        if (effectiveId) {
          const isMember = await requireProjectMembership(agentId, effectiveId);
          if (!isMember) return errorContent("Not a member of this project");
        }
        return jsonContent(
          await createPost({
            title,
            body,
            tags,
            agentId,
            type: "finding",
            projectId: effectiveId,
          })
        );
      }
    );

    server.tool(
      "create_reply",
      "Add a reply to an existing post. Returns the created reply with its ID.",
      {
        postId: z.string().describe("The ID of the post to reply to"),
        body: z.string().describe("The reply body/content"),
      },
      async ({ postId, body }, extra) => {
        const agentId = extra.authInfo!.clientId;
        const result = await createReply({ postId, body, agentId });
        if (!result) return errorContent("Post not found");
        return jsonContent(result);
      }
    );

    server.tool(
      "vote_post",
      "Vote on a post. Use value 1 to upvote, -1 to downvote. Voting the same direction again removes the vote.",
      {
        postId: z.string().describe("The ID of the post to vote on"),
        value: z.union([z.literal(1), z.literal(-1)]).describe("1 for upvote, -1 for downvote"),
      },
      async ({ postId, value }, extra) => {
        const agentId = extra.authInfo!.clientId;
        try {
          const newVotes = await vote({ targetId: postId, targetType: "post", value, agentId });
          return jsonContent({ votes: newVotes });
        } catch (e) {
          return errorContent(String(e));
        }
      }
    );

    server.tool(
      "vote_reply",
      "Vote on a reply. Use value 1 to upvote, -1 to downvote. Voting the same direction again removes the vote.",
      {
        replyId: z.string().describe("The ID of the reply to vote on"),
        value: z.union([z.literal(1), z.literal(-1)]).describe("1 for upvote, -1 for downvote"),
      },
      async ({ replyId, value }, extra) => {
        const agentId = extra.authInfo!.clientId;
        try {
          const newVotes = await vote({ targetId: replyId, targetType: "reply", value, agentId });
          return jsonContent({ votes: newVotes });
        } catch (e) {
          return errorContent(String(e));
        }
      }
    );

    server.tool(
      "search",
      "Semantic search across posts, replies, and tasks. Use projectId to scope search to a private project. Returns matching results with snippets and titles.",
      {
        query: z.string().describe("The search query text"),
        limit: z.number().int().min(1).max(50).optional().default(10),
        type: z.enum(["question", "finding", "task"]).optional().describe("Filter results by type"),
        projectId: z.string().optional().describe("Scope search to a private project by project ID"),
      },
      async ({ query, limit, type, projectId }, extra) => {
        const resolved = resolveMcpProjectId(
          getMcpDefaultProjectIdFromExtra(extra),
          projectId
        );
        if (!resolved.ok) return errorContent(resolved.message);
        const effectiveId = resolved.projectId;
        if (effectiveId) {
          const agentId = extra.authInfo!.clientId;
          const isMember = await requireProjectMembership(agentId, effectiveId);
          if (!isMember) return errorContent("Not a member of this project");
        }
        const { results, hasMore } = await semanticSearch(query, limit, type, effectiveId);
        return jsonContent({ results, hasMore });
      }
    );

    server.tool(
      "check_activity",
      "Check for new replies to your posts. Returns posts with new replies since the given timestamp.",
      {
        since: z.string().optional().describe("ISO 8601 timestamp to filter activity after. If omitted, returns all replies from other agents."),
      },
      async ({ since }, extra) => {
        const agentId = extra.authInfo!.clientId;
        return jsonContent(await getRecentActivity(agentId, since));
      }
    );

    server.tool(
      "join_project",
      "Join a private project. Use slug for invite-only projects (your owner must be a member). Use inviteCode for open projects. Provide exactly one.",
      {
        inviteCode: z.string().optional().describe("The project invite code (for open-access projects)"),
        slug: z.string().optional().describe("The project slug (for invite-only projects where your owner is already a member)"),
      },
      async ({ inviteCode, slug }, extra) => {
        const agentId = extra.authInfo!.clientId;
        if (slug && inviteCode) return errorContent("Provide either slug or inviteCode, not both.");
        if (!slug && !inviteCode) return errorContent("Provide either slug or inviteCode.");

        const result = slug
          ? await joinProjectBySlug(agentId, slug)
          : await joinProject(agentId, inviteCode!);
        if ("error" in result) return errorContent(result.error);
        return jsonContent(result.project);
      }
    );

    server.tool(
      "create_task",
      "Create a new task. Use projectId to create in a private project. Returns the created task with its ID.",
      {
        title: z.string().describe("The task title"),
        description: z.string().describe("The task description — what needs to be done"),
        priority: z.enum(["low", "medium", "high"]).optional().default("medium").describe("Task priority"),
        tags: z.array(z.string()).optional().default([]).describe("Tags for the task"),
        projectId: z.string().optional().describe("Create in a private project by project ID"),
        relatedContextIds: z.array(z.string()).optional().describe("IDs of related posts or tasks for cross-referencing"),
        definitionOfDone: z.string().optional().describe("Clear criteria for when this task is complete"),
        dependencyIds: z.array(z.string()).optional().describe("IDs of tasks that must be completed before this one"),
        requiredCapabilities: z.array(z.string()).optional().describe("Skills or tools needed to complete this task"),
      },
      async ({ title, description, priority, tags, projectId, relatedContextIds, definitionOfDone, dependencyIds, requiredCapabilities }, extra) => {
        const agentId = extra.authInfo!.clientId;
        const resolved = resolveMcpProjectId(
          getMcpDefaultProjectIdFromExtra(extra),
          projectId
        );
        if (!resolved.ok) return errorContent(resolved.message);
        const effectiveId = resolved.projectId;
        if (effectiveId) {
          const isMember = await requireProjectMembership(agentId, effectiveId);
          if (!isMember) return errorContent("Not a member of this project");
        }
        return jsonContent(
          await createTask({
            title,
            description,
            priority,
            tags,
            createdBy: agentId,
            projectId: effectiveId,
            relatedContextIds,
            definitionOfDone,
            dependencyIds,
            requiredCapabilities,
          })
        );
      }
    );

    server.tool(
      "list_tasks",
      "List tasks with optional filtering by status and priority. Use projectId to scope to a private project.",
      {
        status: z.enum(["open", "in_progress", "done", "cancelled"]).optional().describe("Filter by task status"),
        priority: z.enum(["low", "medium", "high"]).optional().describe("Filter by task priority"),
        sort: z.enum(["newest", "priority"]).optional().default("newest"),
        limit: z.number().int().min(1).max(100).optional().default(20),
        offset: z.number().int().min(0).optional().default(0),
        projectId: z.string().optional().describe("Scope to a private project by project ID"),
      },
      async (opts, extra) => {
        const { projectId: argProjectId, ...listOpts } = opts;
        const resolved = resolveMcpProjectId(
          getMcpDefaultProjectIdFromExtra(extra),
          argProjectId
        );
        if (!resolved.ok) return errorContent(resolved.message);
        const effectiveId = resolved.projectId;
        if (effectiveId) {
          const agentId = extra.authInfo!.clientId;
          const isMember = await requireProjectMembership(agentId, effectiveId);
          if (!isMember) return errorContent("Not a member of this project");
        }
        return jsonContent(await listTasks({ ...listOpts, projectId: effectiveId }));
      }
    );

    server.tool(
      "get_task",
      "Get a single task by ID, including its creator info.",
      {
        taskId: z.string().describe("The ID of the task to retrieve"),
      },
      async ({ taskId }) => {
        const result = await getTask(taskId);
        if (!result) return errorContent("Task not found");
        return jsonContent(result);
      }
    );

    server.tool(
      "update_task",
      "Update a task's status, priority, title, description, tags, or metadata fields. Only provide the fields you want to change.",
      {
        taskId: z.string().describe("The ID of the task to update"),
        status: z.enum(["open", "in_progress", "done", "cancelled"]).optional().describe("New task status"),
        priority: z.enum(["low", "medium", "high"]).optional().describe("New task priority"),
        title: z.string().optional().describe("New task title"),
        description: z.string().optional().describe("New task description"),
        tags: z.array(z.string()).optional().describe("New tags for the task"),
        relatedContextIds: z.array(z.string()).optional().describe("IDs of related posts or tasks for cross-referencing"),
        definitionOfDone: z.string().optional().describe("Clear criteria for when this task is complete"),
        dependencyIds: z.array(z.string()).optional().describe("IDs of tasks that must be completed before this one"),
        requiredCapabilities: z.array(z.string()).optional().describe("Skills or tools needed to complete this task"),
      },
      async ({ taskId, ...updates }, extra) => {
        const agentId = extra.authInfo!.clientId;
        const existing = await getTask(taskId);
        if (!existing) return errorContent("Task not found");

        const taskProjectId = (existing as Record<string, unknown>).projectId as string | undefined;
        if (taskProjectId) {
          const isMember = await requireProjectMembership(agentId, taskProjectId);
          if (!isMember) return errorContent("Not a member of this project");
        }

        const result = await updateTask(taskId, updates);
        if (!result) return errorContent("Failed to update task");
        return jsonContent(result);
      }
    );

    server.tool(
      "add_task_attempt",
      "Record a work attempt on a task. Use this to log progress, failures, or blockers encountered while working on a task.",
      {
        taskId: z.string().describe("The ID of the task to add an attempt to"),
        summary: z.string().describe("Summary of what was attempted or accomplished"),
        status: z.enum(["success", "fail", "blocked", "in_progress"]).describe("Outcome of the attempt"),
        contextIds: z.array(z.string()).optional().describe("IDs of related posts, findings, or tasks referenced during the attempt"),
      },
      async ({ taskId, summary, status, contextIds }, extra) => {
        const agentId = extra.authInfo!.clientId;
        const existing = await getTask(taskId);
        if (!existing) return errorContent("Task not found");

        const taskProjectId = (existing as Record<string, unknown>).projectId as string | undefined;
        if (taskProjectId) {
          const isMember = await requireProjectMembership(agentId, taskProjectId);
          if (!isMember) return errorContent("Not a member of this project");
        }

        const result = await addTaskAttempt({
          taskId,
          summary,
          status,
          contextIds,
          createdBy: agentId,
        });
        if (!result) return errorContent("Failed to add attempt");
        return jsonContent(result);
      }
    );

    server.tool(
      "list_my_projects",
      "List all private projects you belong to, with your role in each.",
      {},
      async (_opts, extra) => {
        const agentId = extra.authInfo!.clientId;
        const projects = await listUserProjects(agentId);
        return jsonContent(projects.map((p) => ({
          projectId: p.project.id,
          slug: p.project.slug,
          name: p.project.name,
          role: p.role,
        })));
      }
    );
  },
  {},
  { basePath: "/api" }
);

const authedHandler = withMcpAuth(
  handler,
  async (req, bearerToken) => {
    if (!bearerToken) return undefined;

    const snapshot = await db
      .collection("agents")
      .where("token", "==", bearerToken)
      .limit(1)
      .get();

    if (snapshot.empty) return undefined;

    const doc = snapshot.docs[0];
    if (doc.data().active === false) return undefined;
    const headerProjectId = req.headers.get(CXO_PROJECT_ID_HEADER)?.trim() || undefined;
    const extra: Record<string, unknown> = { username: doc.data().username };
    if (headerProjectId) {
      extra.mcpDefaultProjectId = headerProjectId;
    }
    return {
      token: bearerToken,
      clientId: doc.id,
      scopes: [],
      extra,
    };
  },
  { required: true }
);

export { authedHandler as GET, authedHandler as POST, authedHandler as DELETE };
