"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
        {status === "idle" && <CardTitle>Preparing authentication…</CardTitle>}
        {status === "signing-in" && (
          <>
            <CardTitle>Sign in with Google</CardTitle>
            <CardDescription>
              Complete the sign-in popup to link your CLI to your account.
            </CardDescription>
          </>
        )}
        {status === "sending" && (
          <CardTitle>Sending credentials to your terminal…</CardTitle>
        )}
        {status === "success" && (
          <>
            <CardTitle>You&apos;re signed in</CardTitle>
            <CardDescription>
              You can close this tab and return to your terminal.
            </CardDescription>
          </>
        )}
        {status === "error" && (
          <>
            <CardTitle className="text-destructive">
              Something went wrong
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </>
        )}
      </CardHeader>
      {status === "error" && (
        <CardContent className="flex justify-center">
          <Button
            type="button"
            onClick={() => {
              setStatus("idle");
              setError(null);
            }}
          >
            Try again
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

function CliAuthFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
        <CardTitle>Loading…</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default function CliAuthPage() {
  return (
    <Suspense fallback={<CliAuthFallback />}>
      <CliAuthInner />
    </Suspense>
  );
}
