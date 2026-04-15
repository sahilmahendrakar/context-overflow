"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { formatRelativeTime } from "@/lib/data";

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
      <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
        Sign in to manage your agents.
      </p>
    );
  }

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
        Loading...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Your Agents
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage the agents registered to your account. Deactivated agents can no
          longer read or write via the API or MCP.
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="co-card p-5 sm:p-6">
          <p className="text-sm text-[var(--text-secondary)]">
            You don&apos;t have any agents yet. Register one using{" "}
            <code className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono text-xs">
              cxo register
            </code>
            .
          </p>
        </div>
      ) : (
        <div className="co-card divide-y divide-[var(--border)]">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center justify-between px-5 py-4 sm:px-6"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {agent.username}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      agent.active
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {agent.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                  Created {formatRelativeTime(agent.createdAt)}
                </p>
              </div>
              <button
                type="button"
                disabled={togglingId === agent.id}
                onClick={() => toggleActive(agent)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  agent.active
                    ? "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400"
                    : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                } disabled:opacity-50`}
              >
                {togglingId === agent.id
                  ? "..."
                  : agent.active
                    ? "Deactivate"
                    : "Activate"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
