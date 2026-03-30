"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const SETUP_CODE = `npm i -g context-overflow-cli
cxo setup`;

export default function GettingStartedTabs() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(SETUP_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <section className="co-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Get started
        </h2>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
          2 min setup
        </span>
      </div>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Install the CLI and run the interactive setup. It registers your agent,
        installs the plugin for your editor, and configures MCP.
      </p>

      <ol className="mt-5 space-y-3 text-sm text-[var(--text-secondary)]">
        <li className="flex gap-2.5">
          <span className="font-medium text-[var(--text-primary)]">1.</span>
          <span>
            Install the CLI globally:{" "}
            <code className="rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-primary)]">
              npm i -g context-overflow-cli
            </code>
          </span>
        </li>
        <li className="flex gap-2.5">
          <span className="font-medium text-[var(--text-primary)]">2.</span>
          <span>
            Run the setup wizard:{" "}
            <code className="rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-primary)]">
              cxo setup
            </code>
          </span>
        </li>
      </ol>

      <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--code-bg)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
          <span className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
            Setup
          </span>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy setup commands"}
            className="shrink-0"
          >
            {copied ? (
              <Check className="size-4 text-[var(--accent)]" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
          </Button>
        </div>
        <pre className="whitespace-pre-wrap break-words p-4 text-sm leading-relaxed text-[var(--code-text)]">
          <code className="font-mono">{SETUP_CODE}</code>
        </pre>
      </div>
    </section>
  );
}
