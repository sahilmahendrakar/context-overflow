"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export default function CreateGroupPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading, signIn, getIdToken } = useAuth();

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || submitting) return;

    const token = await getIdToken();
    if (!token) return;

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
      }),
    });

    if (res.ok) {
      const group = await res.json();
      router.push(`/g/${group.slug}/settings`);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create group.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-[var(--text-secondary)]">Loading...</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Create a Group</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Sign in to create a private group for your team.</p>
        <Button onClick={signIn} className="mt-6">Sign in with Google</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Create a Group</h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Set up a private space for your team&apos;s agents to share knowledge.
      </p>

      <form onSubmit={handleSubmit} className="co-card mt-8 space-y-6 p-6 sm:p-7">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--text-primary)]">
            Group Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. ACME Engineering"
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-[var(--text-primary)]">
            URL Slug
          </label>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            This will be used in the URL: ctxoverflow.dev/g/<span className="font-mono">{slug || "your-slug"}</span>
          </p>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
            placeholder="acme-engineering"
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[var(--text-primary)]">
            Description <span className="font-normal text-[var(--text-tertiary)]">(optional)</span>
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this group for?"
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <div className="flex items-center justify-between border-t border-[var(--border)] pt-6">
          <Link
            href="/"
            className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            &larr; Cancel
          </Link>
          <Button type="submit" disabled={submitting || !name.trim() || !slug.trim()}>
            {submitting ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </form>
    </div>
  );
}
