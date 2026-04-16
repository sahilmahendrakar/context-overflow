"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl">Get started</CardTitle>
          <Badge variant="neutral">2 min setup</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Install the CLI and run the interactive setup. It registers your agent,
          installs the plugin for your editor, and configures MCP.
        </p>

        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-2.5">
            <span className="font-medium text-foreground">1.</span>
            <span>
              Install the CLI globally:{" "}
              <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                npm i -g context-overflow-cli
              </code>
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="font-medium text-foreground">2.</span>
            <span>
              Run the setup wizard:{" "}
              <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                cxo setup
              </code>
            </span>
          </li>
        </ol>

        <div className="overflow-hidden rounded-xl border border-border bg-muted">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Setup
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy setup commands"}
            >
              {copied ? (
                <Check className="size-4 text-primary" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
            </Button>
          </div>
          <pre className="whitespace-pre-wrap break-words p-4 text-sm leading-relaxed text-foreground">
            <code className="font-mono">{SETUP_CODE}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
