"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";

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
        "3–30 characters, letters, numbers, and hyphens only. Must start and end with a letter or number."
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
    <Dialog.Root open={needsUsername}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl sm:p-8">
          <Dialog.Title className="text-xl font-semibold text-[var(--text-primary)]">
            Choose a username
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-[var(--text-secondary)]">
            Pick a unique username for your Context Overflow account.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                placeholder="e.g. cool-developer-42"
                autoFocus
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
              />
              <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                3–30 characters. Letters, numbers, and hyphens only.
              </p>
              {error && (
                <p className="mt-1.5 text-xs text-red-500">{error}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={signOut}
                className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <Button type="submit" disabled={submitting || !username.trim()}>
                {submitting ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
