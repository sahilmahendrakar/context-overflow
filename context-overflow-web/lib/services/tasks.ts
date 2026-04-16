import { db } from "@/lib/firebase";
import { generateEmbedding } from "@/lib/embeddings";
import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "crypto";
import type { PublicUser, TaskStatus, TaskPriority, TaskAttemptStatus } from "@/lib/data";
import { docToPublicUser } from "@/lib/user-from-doc";

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      .map((t) => t.trim());
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s) as unknown;
        if (Array.isArray(parsed)) {
          return parsed
            .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
            .map((t) => t.trim());
        }
      } catch {
        /* ignore */
      }
    }
    return s.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

export async function listTasks(opts: {
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  sort?: string;
  limit?: number;
  offset?: number;
  projectId?: string | null;
}) {
  const { status, priority, sort = "newest", limit = 20, offset = 0, projectId } = opts;

  let query: FirebaseFirestore.Query = db.collection("tasks");

  if (projectId) {
    query = query.where("projectId", "==", projectId);
  } else {
    query = query.where("projectId", "==", null);
  }

  if (status) {
    query = query.where("status", "==", status);
  }

  if (priority) {
    query = query.where("priority", "==", priority);
  }

  if (sort === "priority") {
    query = query.orderBy("priority", "asc");
  } else {
    query = query.orderBy("createdAt", "desc");
  }

  query = query.offset(offset).limit(limit);

  const snapshot = await query.get();

  const userIds = new Set<string>();
  const tasks = snapshot.docs.map((doc) => {
    const data = doc.data();
    const createdBy = data.createdBy as string;
    userIds.add(createdBy);
    return {
      id: doc.id,
      ...data,
      tags: normalizeTags(data.tags),
      createdBy,
    };
  });

  const usersById: Record<string, PublicUser> = {};
  if (userIds.size > 0) {
    const userDocs = await db.getAll(
      ...[...userIds].map((id) => db.collection("users").doc(id))
    );
    for (const doc of userDocs) {
      if (doc.exists) {
        usersById[doc.id] = docToPublicUser(doc);
      }
    }
  }

  return tasks.map((t) => ({
    ...t,
    creator: usersById[t.createdBy] || null,
  }));
}

export async function getTask(taskId: string) {
  const taskDoc = await db.collection("tasks").doc(taskId).get();

  if (!taskDoc.exists) {
    return null;
  }

  const raw = taskDoc.data()!;
  const taskData = { id: taskDoc.id, ...raw, tags: normalizeTags(raw.tags) };

  const userIds = new Set<string>();
  const creatorId = raw.createdBy as string;
  if (creatorId) userIds.add(creatorId);

  const attempts = (raw.attempts as Array<Record<string, unknown>>) || [];
  for (const a of attempts) {
    if (typeof a.createdBy === "string") userIds.add(a.createdBy);
  }

  const usersById: Record<string, PublicUser> = {};
  if (userIds.size > 0) {
    const userDocs = await db.getAll(
      ...[...userIds].map((id) => db.collection("users").doc(id))
    );
    for (const doc of userDocs) {
      if (doc.exists) {
        usersById[doc.id] = docToPublicUser(doc);
      }
    }
  }

  const hydratedAttempts = attempts.map((a) => ({
    ...a,
    creator: usersById[a.createdBy as string] || null,
  }));

  return {
    ...taskData,
    attempts: hydratedAttempts,
    creator: usersById[creatorId] || null,
  };
}

export async function createTask(data: {
  title: string;
  description: string;
  priority?: TaskPriority;
  tags?: string[] | string;
  createdBy: string;
  projectId?: string;
  relatedContextIds?: string[];
  definitionOfDone?: string;
  dependencyIds?: string[];
  requiredCapabilities?: string[];
}) {
  const taskRef = db.collection("tasks").doc();
  const now = new Date().toISOString();

  const taskData: Record<string, unknown> = {
    title: data.title,
    description: data.description,
    status: "open",
    priority: data.priority ?? "medium",
    tags: normalizeTags(data.tags),
    createdBy: data.createdBy,
    projectId: data.projectId ?? null,
    attempts: [],
    createdAt: now,
    updatedAt: now,
  };

  if (data.relatedContextIds) taskData.relatedContextIds = data.relatedContextIds;
  if (data.definitionOfDone) taskData.definitionOfDone = data.definitionOfDone;
  if (data.dependencyIds) taskData.dependencyIds = data.dependencyIds;
  if (data.requiredCapabilities) taskData.requiredCapabilities = data.requiredCapabilities;

  await taskRef.set(taskData);

  const textForEmbedding = `${data.title}\n\n${data.description}`;
  try {
    const embedding = await generateEmbedding(textForEmbedding);
    const searchEntry: Record<string, unknown> = {
      sourceType: "task",
      sourceId: taskRef.id,
      taskId: taskRef.id,
      text: textForEmbedding,
      embedding: FieldValue.vector(embedding),
      projectId: data.projectId ?? null,
      createdAt: now,
    };
    await db.collection("search_index").doc().set(searchEntry);
  } catch (e) {
    console.error("Failed to generate embedding for task:", e);
  }

  return { taskId: taskRef.id, ...taskData };
}

export async function updateTask(
  taskId: string,
  updates: {
    status?: TaskStatus;
    priority?: TaskPriority;
    title?: string;
    description?: string;
    tags?: string[] | string;
    relatedContextIds?: string[];
    definitionOfDone?: string;
    dependencyIds?: string[];
    requiredCapabilities?: string[];
  }
) {
  const taskRef = db.collection("tasks").doc(taskId);
  const taskDoc = await taskRef.get();

  if (!taskDoc.exists) {
    return null;
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updatedAt: now };

  if (updates.status) patch.status = updates.status;
  if (updates.priority) patch.priority = updates.priority;
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.tags !== undefined) patch.tags = normalizeTags(updates.tags);
  if (updates.relatedContextIds !== undefined) patch.relatedContextIds = updates.relatedContextIds;
  if (updates.definitionOfDone !== undefined) patch.definitionOfDone = updates.definitionOfDone;
  if (updates.dependencyIds !== undefined) patch.dependencyIds = updates.dependencyIds;
  if (updates.requiredCapabilities !== undefined) patch.requiredCapabilities = updates.requiredCapabilities;

  await taskRef.update(patch);

  if (updates.title !== undefined || updates.description !== undefined) {
    const current = taskDoc.data()!;
    const newTitle = updates.title ?? (current.title as string);
    const newDesc = updates.description ?? (current.description as string);
    const textForEmbedding = `${newTitle}\n\n${newDesc}`;
    try {
      const embedding = await generateEmbedding(textForEmbedding);

      const existingIndex = await db
        .collection("search_index")
        .where("sourceType", "==", "task")
        .where("sourceId", "==", taskId)
        .limit(1)
        .get();

      const entryData: Record<string, unknown> = {
        sourceType: "task",
        sourceId: taskId,
        taskId,
        text: textForEmbedding,
        embedding: FieldValue.vector(embedding),
        projectId: current.projectId ?? null,
        createdAt: now,
      };

      if (existingIndex.empty) {
        await db.collection("search_index").doc().set(entryData);
      } else {
        await existingIndex.docs[0].ref.update(entryData);
      }
    } catch (e) {
      console.error("Failed to update embedding for task:", e);
    }
  }

  const updated = await taskRef.get();
  return { id: taskId, ...updated.data(), tags: normalizeTags(updated.data()!.tags) };
}

export async function addTaskAttempt(data: {
  taskId: string;
  summary: string;
  status: TaskAttemptStatus;
  contextIds?: string[];
  createdBy: string;
}) {
  const taskRef = db.collection("tasks").doc(data.taskId);
  const taskDoc = await taskRef.get();

  if (!taskDoc.exists) {
    return null;
  }

  const attempt = {
    id: randomUUID(),
    createdBy: data.createdBy,
    createdAt: new Date().toISOString(),
    summary: data.summary,
    contextIds: data.contextIds ?? [],
    status: data.status,
  };

  await taskRef.update({
    attempts: FieldValue.arrayUnion(attempt),
    updatedAt: attempt.createdAt,
  });

  return getTask(data.taskId);
}
