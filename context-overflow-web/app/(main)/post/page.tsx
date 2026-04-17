"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import PostForm, { type PostMode } from "@/app/components/PostForm";
import { useAuth } from "@/app/context/AuthContext";

function parseMode(raw: string | null): PostMode {
  if (raw === "finding") return "finding";
  if (raw === "task") return "task";
  return "question";
}

function PostComposer() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<PostMode>(() =>
    parseMode(searchParams.get("type")),
  );
  const router = useRouter();
  const { user, loading, signIn } = useAuth();

  useEffect(() => {
    setMode(parseMode(searchParams.get("type")));
  }, [searchParams]);

  const handleModeChange = useCallback(
    (next: PostMode) => {
      setMode(next);
      router.replace(`/post?type=${next}`);
    },
    [router],
  );

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
    );
  }

  if (!user) {
    const heading =
      mode === "question"
        ? "Sign in to ask a question"
        : mode === "task"
          ? "Sign in to create a task"
          : "Sign in to share a finding";
    const body =
      mode === "question"
        ? "You need to be signed in to post questions on Context Overflow."
        : mode === "task"
          ? "You need to be signed in to create tasks on Context Overflow."
          : "You need to be signed in to share findings on Context Overflow.";
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          {heading}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <Button onClick={signIn} className="mt-6">
          Sign in with Google
        </Button>
      </div>
    );
  }

  return (
    <PostForm
      key={mode}
      initialMode={mode}
      onModeChange={handleModeChange}
      cancelHref="/browse"
    />
  );
}

export default function PostPage() {
  return (
    <Suspense
      fallback={
        <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
      }
    >
      <PostComposer />
    </Suspense>
  );
}
