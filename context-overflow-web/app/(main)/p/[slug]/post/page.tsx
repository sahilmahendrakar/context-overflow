"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";
import { useProject } from "../ProjectContext";
import { cn } from "@/lib/utils";

type PostMode = "question" | "finding" | "task";

export default function ProjectPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const project = useProject();
  const [mode, setMode] = useState<PostMode>("question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { user, loading, getIdToken } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim() || submitting) return;

    const idToken = await getIdToken();
    if (!idToken) return;

    setSubmitting(true);
    try {
      const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);

      if (mode === "task") {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            description: body.trim(),
            priority,
            tags: parsedTags,
            projectId: project.id,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          router.push(`/p/${slug}/tasks/${data.taskId}`);
        }
      } else {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            body: body.trim(),
            type: mode,
            projectId: project.id,
            tags: parsedTags,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          router.push(`/p/${slug}/posts/${data.postId}`);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-[var(--text-secondary)]">Loading...</p>;
  }

  if (!user) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Sign in to create a post</h1>
      </div>
    );
  }

  const isQuestion = mode === "question";
  const isTask = mode === "task";

  const modeToggle = (m: PostMode) => (
    <button
      key={m}
      type="button"
      onClick={() => setMode(m)}
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-medium transition",
        mode === m
          ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      )}
    >
      {m === "question" ? "Ask a question" : m === "finding" ? "Share a finding" : "Create a task"}
    </button>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div
        className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1"
        role="group"
      >
        {modeToggle("question")}
        {modeToggle("finding")}
        {modeToggle("task")}
      </div>

      <h1 className="mt-6 text-2xl font-semibold text-[var(--text-primary)]">
        {isQuestion ? "Ask a Question" : isTask ? "Create a Task" : "Share a Finding"}
      </h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        This {isTask ? "task" : "post"} will be shared within your project only.
      </p>

      <form onSubmit={handleSubmit} className="co-card mt-8 space-y-6 p-6 sm:p-7">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[var(--text-primary)]">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isQuestion ? "What's your question?" : isTask ? "What needs to be done?" : "What did you discover?"}
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-[var(--text-primary)]">
            {isQuestion ? "Body" : isTask ? "Description" : "Details"}
          </label>
          <textarea
            id="body"
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={isTask ? "Describe what needs to be done, acceptance criteria, and context." : "Describe in detail. Markdown is supported."}
            className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        {isTask && (
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-[var(--text-primary)]">Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        )}

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-[var(--text-primary)]">Tags</label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. rag, embeddings, llm"
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] pt-6">
          <Link
            href={`/p/${slug}`}
            className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            &larr; Back to project
          </Link>
          <Button type="submit" disabled={submitting || !title.trim() || !body.trim()}>
            {submitting ? "Posting..." : isQuestion ? "Post Your Question" : isTask ? "Create Task" : "Post Your Finding"}
          </Button>
        </div>
      </form>
    </div>
  );
}
