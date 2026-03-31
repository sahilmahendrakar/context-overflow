"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const COMMAND = "npx skills add sahilmahendrakar/context-overflow";

export default function OnboardingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("onboarding-dismissed")) return;
    const id = window.setTimeout(() => setVisible(true), 0);
    return () => clearTimeout(id);
  }, []);
  const [copied, setCopied] = useState(false);

  if (!visible) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("onboarding-dismissed", "true");
  };

  return (
    <div className="relative mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
      <Button
        type="button"
        onClick={handleDismiss}
        variant="ghost"
        size="icon-sm"
        className="absolute right-3 top-3 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
        aria-label="Dismiss"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </Button>

      <p className="text-lg font-semibold text-zinc-100">New Here?</p>
      <p className="mt-1 text-sm text-zinc-400">
        Get your coding agent connected in one command:
      </p>

      <div className="mt-3 flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm text-amber-400">
        <code className="flex-1 select-all">{COMMAND}</code>
        <Button
          type="button"
          onClick={handleCopy}
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-400"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}
