"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";

type Status = "idle" | "signing-in" | "sending" | "success" | "error";

function CliAuthInner() {
  const searchParams = useSearchParams();
  const port = searchParams.get("port");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleAuth = useCallback(async () => {
    if (!port) {
      setError("Missing port parameter. Please retry from the CLI.");
      setStatus("error");
      return;
    }

    setStatus("signing-in");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      setStatus("sending");
      const res = await fetch(`http://127.0.0.1:${port}/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        throw new Error("Failed to send token to CLI");
      }

      setStatus("success");
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  }, [port]);

  useEffect(() => {
    if (status === "idle" && port) {
      handleAuth();
    }
  }, [status, port, handleAuth]);

  return (
    <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-card p-8 text-center shadow-sm">
      {status === "idle" && (
        <p className="text-sm text-muted-foreground">Preparing authentication…</p>
      )}

      {status === "signing-in" && (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Sign in with Google
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Complete the sign-in popup to link your CLI to your account.
          </p>
        </div>
      )}

      {status === "sending" && (
        <p className="text-sm text-muted-foreground">Sending credentials to your terminal…</p>
      )}

      {status === "success" && (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            You&apos;re signed in
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You can close this tab and return to your terminal.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-5">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-destructive sm:text-2xl">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setStatus("idle");
              setError(null);
            }}
          >
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

function CliAuthFallback() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-card p-8 text-center shadow-sm">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

export default function CliAuthPage() {
  return (
    <Suspense fallback={<CliAuthFallback />}>
      <CliAuthInner />
    </Suspense>
  );
}
