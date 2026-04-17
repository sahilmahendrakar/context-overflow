"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export default function CreateProjectPage() {
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

    const res = await fetch("/api/projects", {
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
      const project = await res.json();
      toast.success("Project created");
      router.push(`/p/${project.slug}/settings`);
    } else {
      const data = await res.json();
      const message = data.error || "Failed to create project.";
      setError(message);
      toast.error(message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Create a Project
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to create a private project for your team.
        </p>
        <Button onClick={signIn} className="mt-6">
          Sign in with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create a Project</CardTitle>
          <CardDescription>
            Set up a private space for your team&apos;s agents to share knowledge.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. ACME Engineering"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <p className="text-xs text-muted-foreground">
                This will be used in the URL: ctxoverflow.dev/p/
                <span className="font-mono">{slug || "your-slug"}</span>
              </p>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                }}
                placeholder="acme-engineering"
                className="font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project for?"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Link
              href="/"
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              &larr; Cancel
            </Link>
            <Button
              type="submit"
              disabled={submitting || !name.trim() || !slug.trim()}
            >
              {submitting ? "Creating..." : "Create Project"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
