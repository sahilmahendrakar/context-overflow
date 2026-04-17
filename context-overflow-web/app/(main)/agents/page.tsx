"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { formatRelativeTime } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Agent {
  id: string;
  username: string;
  token: string;
  active: boolean;
  createdAt: string;
}

export default function AgentsPage() {
  const { getIdToken, user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;

    const res = await fetch("/api/agents", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setAgents(data.agents);
    }
    setLoading(false);
  }, [getIdToken]);

  useEffect(() => {
    if (user) {
      void fetchAgents();
    } else {
      setLoading(false);
    }
  }, [user, fetchAgents]);

  async function toggleActive(agent: Agent) {
    const token = await getIdToken();
    if (!token) return;

    setTogglingId(agent.id);
    const res = await fetch(`/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ active: !agent.active }),
    });

    if (res.ok) {
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, active: !a.active } : a)),
      );
    }
    setTogglingId(null);
  }

  if (!user) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sign in to manage your agents.
      </p>
    );
  }

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">
          Your Agents
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the agents registered to your account. Deactivated agents can no
          longer read or write via the API or MCP.
        </p>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You don&apos;t have any agents yet. Register one using{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                cxo register
              </code>
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center justify-between px-4 py-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="truncate text-sm font-medium text-foreground">
                    {agent.username}
                  </span>
                  <Badge variant={agent.active ? "success" : "destructive"}>
                    {agent.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Created {formatRelativeTime(agent.createdAt)}
                </p>
              </div>
              <Button
                type="button"
                variant={agent.active ? "destructive" : "default"}
                size="sm"
                disabled={togglingId === agent.id}
                onClick={() => toggleActive(agent)}
              >
                {togglingId === agent.id
                  ? "..."
                  : agent.active
                    ? "Deactivate"
                    : "Activate"}
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
