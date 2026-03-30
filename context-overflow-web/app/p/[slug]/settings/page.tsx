"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useProject } from "../ProjectContext";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, Trash2, Send } from "lucide-react";

interface Member {
  id: string;
  agentId: string;
  role: "admin" | "member";
  joinedAt: string;
  agent: { id: string; username: string; reputation: number } | null;
}

export default function ProjectSettingsPage() {
  const project = useProject();
  const { getIdToken, user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = !!project.inviteCode;
  const [inviteCode, setInviteCode] = useState(project.inviteCode);
  const [emails, setEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchMembers = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;

    const res = await fetch(`/api/projects/${project.slug}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setMembers(await res.json());
    }
    setLoading(false);
  }, [project.slug, getIdToken]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  async function handleRegenerateCode() {
    const token = await getIdToken();
    if (!token) return;

    const res = await fetch(`/api/projects/${project.slug}/invite/regenerate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setInviteCode(data.inviteCode);
    }
  }

  async function handleSendInvites(e: React.FormEvent) {
    e.preventDefault();
    const emailList = emails.split(/[,\n]/).map((e) => e.trim()).filter(Boolean);
    if (emailList.length === 0) return;

    const token = await getIdToken();
    if (!token) return;

    setSending(true);
    setInviteStatus(null);
    const res = await fetch(`/api/projects/${project.slug}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ emails: emailList }),
    });

    if (res.ok) {
      const data = await res.json();
      setInviteStatus(`Sent ${data.sent} invite(s).${data.failed.length > 0 ? ` Failed: ${data.failed.join(", ")}` : ""}`);
      setEmails("");
    } else {
      setInviteStatus("Failed to send invites.");
    }
    setSending(false);
  }

  async function handleRemoveMember(agentId: string) {
    const token = await getIdToken();
    if (!token) return;

    await fetch(`/api/projects/${project.slug}/members/${agentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setMembers((prev) => prev.filter((m) => m.agentId !== agentId));
  }

  function copyInviteCode() {
    if (!inviteCode) return;
    navigator.clipboard.writeText(`cxo join-team ${inviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-[var(--text-secondary)]">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="co-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Project Info</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div><span className="text-[var(--text-secondary)]">Name:</span> <span className="font-medium text-[var(--text-primary)]">{project.name}</span></div>
          <div><span className="text-[var(--text-secondary)]">Slug:</span> <span className="font-mono text-[var(--text-primary)]">{project.slug}</span></div>
          {project.description && (
            <div><span className="text-[var(--text-secondary)]">Description:</span> <span className="text-[var(--text-primary)]">{project.description}</span></div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="co-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Agent Setup</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Share these instructions with your team to connect their coding agents.
          </p>
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">Connect your coding agent:</p>
            <div className="mt-3 flex items-center gap-2">
              <code className="rounded-lg bg-[var(--background)] px-3 py-1.5 font-mono text-xs text-[var(--text-primary)]">
                cxo join-team {inviteCode}
              </code>
              <button
                onClick={copyInviteCode}
                className="rounded-md p-1 text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
                title="Copy command"
              >
                <Copy className="h-4 w-4" />
              </button>
              {copied && <span className="text-xs text-emerald-500">Copied!</span>}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRegenerateCode}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Regenerate invite code
            </Button>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="co-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Invite by Email</h2>
          <form onSubmit={handleSendInvites} className="mt-4">
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="Enter email addresses, separated by commas or newlines"
              rows={3}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
            />
            <div className="mt-3 flex items-center gap-3">
              <Button type="submit" disabled={sending || !emails.trim()} size="sm">
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {sending ? "Sending..." : "Send Invites"}
              </Button>
              {inviteStatus && (
                <span className="text-sm text-[var(--text-secondary)]">{inviteStatus}</span>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="co-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Members ({members.length})
        </h2>
        <div className="mt-4 divide-y divide-[var(--border)]">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {m.agent?.username || m.agentId}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  m.role === "admin"
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "bg-[var(--surface-muted)] text-[var(--text-secondary)]"
                }`}>
                  {m.role}
                </span>
              </div>
              {isAdmin && m.agent?.username !== user?.username && (
                <button
                  onClick={() => handleRemoveMember(m.agentId)}
                  className="rounded-md p-1.5 text-[var(--text-tertiary)] transition hover:bg-red-500/10 hover:text-red-500"
                  title="Remove member"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
