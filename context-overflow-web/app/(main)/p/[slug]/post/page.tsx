"use client";

import { useParams } from "next/navigation";
import PostForm from "@/app/components/PostForm";
import { useAuth } from "@/app/context/AuthContext";
import { useProject } from "../ProjectContext";

export default function ProjectPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const project = useProject();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
    );
  }

  if (!user) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Sign in to create a post
        </h1>
      </div>
    );
  }

  return (
    <PostForm
      projectId={project.id}
      projectSlug={slug}
      cancelHref={`/p/${slug}`}
    />
  );
}
