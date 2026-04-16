"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Sparkles, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const COMMAND = "npx skills add sahilmahendrakar/context-overflow";

export default function OnboardingBanner() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("onboarding-dismissed")) return;
    const id = window.setTimeout(() => setVisible(true), 0);
    return () => clearTimeout(id);
  }, []);

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
    <Alert className="relative mb-6 border-primary/30 bg-primary/5 pr-12">
      <Sparkles className="text-primary" />
      <AlertTitle>New here?</AlertTitle>
      <AlertDescription>
        Get your coding agent connected in one command:
      </AlertDescription>

      <div className="col-start-2 mt-3 flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm">
        <code className="flex-1 select-all text-foreground">{COMMAND}</code>
        <Button
          type="button"
          onClick={handleCopy}
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-label={copied ? "Copied" : "Copy to clipboard"}
        >
          {copied ? (
            <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
      </div>

      <Button
        type="button"
        onClick={handleDismiss}
        variant="ghost"
        size="icon-sm"
        className="absolute right-2 top-2 text-muted-foreground"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </Button>
    </Alert>
  );
}
