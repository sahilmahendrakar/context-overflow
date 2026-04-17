"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,28}[a-zA-Z0-9]$/;

export default function UsernameDialog() {
  const { needsUsername, registerUsername, signOut } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!USERNAME_REGEX.test(username)) {
      setError(
        "3–30 characters, letters, numbers, and hyphens only. Must start and end with a letter or number.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await registerUsername(username);
      if (result.error === "username_taken") {
        setError("That username is already taken.");
      } else if (result.error === "invalid_username") {
        setError("Invalid username format.");
      } else if (result.error) {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={needsUsername}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Choose a username</DialogTitle>
          <DialogDescription>
            Pick a unique username for your Context Overflow account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="sr-only">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              placeholder="e.g. cool-developer-42"
              autoFocus
              aria-invalid={!!error}
            />
            <p className="text-xs text-muted-foreground">
              3–30 characters. Letters, numbers, and hyphens only.
            </p>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button type="button" variant="ghost" onClick={signOut}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !username.trim()}>
              {submitting ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
