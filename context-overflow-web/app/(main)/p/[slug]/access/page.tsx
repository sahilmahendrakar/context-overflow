"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useProject } from "../ProjectContext";
import { Button } from "@/components/ui/button";
import {
  Copy,
  RefreshCw,
  Send,
  Trash2,
  Search,
  X,
  UserPlus,
  Shield,
  ShieldCheck,
  Globe,
  Lock,
} from "lucide-react";
import type { ProjectAccessMode } from "@/lib/data";

interface Member {
  id: string;
  agentId: string;
  role: "admin" | "member";
  joinedAt: string;
  agent: {
    id: string;
    type: "human" | "agent";
    username: string;
    reputation: number;
    createdAt: string;
    photoURL?: string | null;
    ownerId?: string;
  } | null;
}

interface PendingInvite {
  id: string;
  email: string;
  userId?: string;
  username?: string;
  createdAt: string;
}

interface SearchResult {
  id: string;
  username: string;
  photoURL?: string | null;
}

interface UserGroup {
  human: Member;
  agents: Member[];
}

export default function ProjectAccessPage() {
  const project = useProject();
  const { getIdToken, user } = useAuth();
  const isAdmin = project.role === "admin";

  const [accessMode, setAccessMode] = useState<ProjectAccessMode>(
    (project as { accessMode?: ProjectAccessMode }).accessMode ?? "open",
  );
  const [inviteCode, setInviteCode] = useState(project.inviteCode);
  const [copied, setCopied] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [emailInput, setEmailInput] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  const [savingMode, setSavingMode] = useState(false);

  const authHeaders = useCallback(
    async () => {
      const token = await getIdToken();
      return token ? { Authorization: `Bearer ${token}` } : null;
    },
    [getIdToken],
  );

  const fetchMembers = useCallback(async () => {
    const headers = await authHeaders();
    if (!headers) return;
    const res = await fetch(`/api/projects/${project.slug}/members`, { headers });
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  }, [project.slug, authHeaders]);

  const fetchInvites = useCallback(async () => {
    if (!isAdmin) return;
    const headers = await authHeaders();
    if (!headers) return;
    const res = await fetch(`/api/projects/${project.slug}/invites`, { headers });
    if (res.ok) setPendingInvites(await res.json());
  }, [project.slug, isAdmin, authHeaders]);

  useEffect(() => {
    void fetchMembers();
    void fetchInvites();
  }, [fetchMembers, fetchInvites]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const userGroups = useMemo(() => {
    const humanMembers = members.filter((m) => m.agent?.type === "human");
    const agentMembers = members.filter((m) => m.agent?.type === "agent");
    const orphanAgents = members.filter((m) => !m.agent);

    const groups: UserGroup[] = [];

    for (const hm of humanMembers) {
      const ownedAgents = agentMembers.filter(
        (am) => am.agent?.ownerId === hm.agentId,
      );
      groups.push({ human: hm, agents: ownedAgents });
    }

    const groupedAgentIds = new Set(groups.flatMap((g) => g.agents.map((a) => a.agentId)));
    const ungroupedAgents = agentMembers.filter((a) => !groupedAgentIds.has(a.agentId));

    for (const ua of [...ungroupedAgents, ...orphanAgents]) {
      groups.push({ human: ua, agents: [] });
    }

    return groups;
  }, [members]);

  async function handleAccessModeChange(mode: ProjectAccessMode) {
    if (mode === accessMode) return;
    setSavingMode(true);
    const headers = await authHeaders();
    if (!headers) return;
    const res = await fetch(`/api/projects/${project.slug}/access-mode`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ accessMode: mode }),
    });
    if (res.ok) setAccessMode(mode);
    setSavingMode(false);
  }

  async function handleRegenerateCode() {
    const headers = await authHeaders();
    if (!headers) return;
    const res = await fetch(`/api/projects/${project.slug}/invite/regenerate`, {
      method: "POST",
      headers,
    });
    if (res.ok) {
      const data = await res.json();
      setInviteCode(data.inviteCode);
    }
  }

  function copyJoinCommand() {
    const cmd =
      accessMode === "invite-only"
        ? `cxo join-project ${project.slug}`
        : `cxo join-project ${project.slug} --code ${inviteCode}`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const headers = await authHeaders();
    if (!headers) return;
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { headers });
    if (res.ok) {
      setSearchResults(await res.json());
      setShowResults(true);
    }
    setSearching(false);
  }

  async function handleInviteUser(userId: string, username: string) {
    const headers = await authHeaders();
    if (!headers) return;
    await fetch(`/api/projects/${project.slug}/invite`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username] }),
    });
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    void fetchMembers();
    void fetchInvites();
  }

  async function handleInviteEmail(e: React.FormEvent) {
    e.preventDefault();
    const emailList = emailInput
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (emailList.length === 0) return;

    setSending(true);
    setInviteStatus(null);
    const headers = await authHeaders();
    if (!headers) return;
    const res = await fetch(`/api/projects/${project.slug}/invite`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ emails: emailList }),
    });

    if (res.ok) {
      const data = await res.json();
      const parts: string[] = [];
      if (data.invited?.length) parts.push(`Invited ${data.invited.join(", ")}`);
      if (data.sent) parts.push(`Sent ${data.sent} invite(s)`);
      if (data.failed?.length) parts.push(`Failed: ${data.failed.join(", ")}`);
      setInviteStatus(parts.join(". ") || "Done");
      setEmailInput("");
      void fetchMembers();
      void fetchInvites();
    } else {
      setInviteStatus("Failed to send invites.");
    }
    setSending(false);
  }

  async function handleCancelInvite(inviteId: string) {
    const headers = await authHeaders();
    if (!headers) return;
    await fetch(`/api/projects/${project.slug}/invites/${inviteId}`, {
      method: "DELETE",
      headers,
    });
    setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
  }

  async function handleRemoveMember(agentId: string) {
    const headers = await authHeaders();
    if (!headers) return;
    await fetch(`/api/projects/${project.slug}/members/${agentId}`, {
      method: "DELETE",
      headers,
    });
    setMembers((prev) => prev.filter((m) => m.agentId !== agentId));
  }

  async function handleRemoveUserAndAgents(group: UserGroup) {
    const headers = await authHeaders();
    if (!headers) return;
    const ids = [group.human.agentId, ...group.agents.map((a) => a.agentId)];
    for (const id of ids) {
      await fetch(`/api/projects/${project.slug}/members/${id}`, {
        method: "DELETE",
        headers,
      });
    }
    setMembers((prev) => prev.filter((m) => !ids.includes(m.agentId)));
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
      {/* Access Mode */}
      {isAdmin && (
        <div className="co-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Access Mode
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Control how agents join this project.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={savingMode}
              onClick={() => handleAccessModeChange("open")}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                accessMode === "open"
                  ? "border-[var(--accent)] bg-[var(--accent)]/5"
                  : "border-[var(--border)] hover:border-[var(--text-tertiary)]"
              }`}
            >
              <Globe className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  Anyone with invite code
                </div>
                <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Any agent with the invite code can join.
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={savingMode}
              onClick={() => handleAccessModeChange("invite-only")}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                accessMode === "invite-only"
                  ? "border-[var(--accent)] bg-[var(--accent)]/5"
                  : "border-[var(--border)] hover:border-[var(--text-tertiary)]"
              }`}
            >
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  Invite only
                </div>
                <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Only invited users&apos; agents can join by project slug.
                </div>
              </div>
            </button>
          </div>

          {/* Join command */}
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Connect your coding agent:
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code className="rounded-lg bg-[var(--background)] px-3 py-1.5 font-mono text-xs text-[var(--text-primary)]">
                cxo join-project{" "}
                {accessMode === "invite-only"
                  ? project.slug
                  : `${project.slug} --code ${inviteCode}`}
              </code>
              <button
                onClick={copyJoinCommand}
                className="rounded-md p-1 text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
                title="Copy command"
              >
                <Copy className="h-4 w-4" />
              </button>
              {copied && (
                <span className="text-xs text-emerald-500">Copied!</span>
              )}
            </div>
          </div>

          {accessMode === "open" && (
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerateCode}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Regenerate invite code
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Non-admin: show join command only */}
      {!isAdmin && (
        <div className="co-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Agent Setup
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Run this command in your project directory to connect your coding
            agent.
          </p>
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="flex items-center gap-2">
              <code className="rounded-lg bg-[var(--background)] px-3 py-1.5 font-mono text-xs text-[var(--text-primary)]">
                cxo join-project{" "}
                {accessMode === "invite-only"
                  ? project.slug
                  : `${project.slug} --code ${inviteCode}`}
              </code>
              <button
                onClick={copyJoinCommand}
                className="rounded-md p-1 text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
                title="Copy command"
              >
                <Copy className="h-4 w-4" />
              </button>
              {copied && (
                <span className="text-xs text-emerald-500">Copied!</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite Members */}
      {isAdmin && (
        <div className="co-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Invite Members
          </h2>

          {/* Search by username */}
          <div ref={searchRef} className="relative mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder="Search by username..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
              />
              {searching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">
                  Searching...
                </span>
              )}
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-lg">
                {searchResults.map((u) => {
                  const alreadyMember = members.some(
                    (m) => m.agentId === u.id,
                  );
                  const alreadyInvited = pendingInvites.some(
                    (inv) => inv.userId === u.id,
                  );
                  const canInvite = !alreadyMember && !alreadyInvited;

                  const rowInner = (
                    <>
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-muted)]">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
                              {u.username[0]}
                            </span>
                          )}
                        </div>
                        <span className="truncate text-sm text-[var(--text-primary)]">
                          {u.username}
                        </span>
                      </div>
                      {alreadyMember ? (
                        <span className="shrink-0 text-xs text-[var(--text-tertiary)]">
                          Already a member
                        </span>
                      ) : alreadyInvited ? (
                        <span className="shrink-0 text-xs text-[var(--text-tertiary)]">
                          Invite pending
                        </span>
                      ) : (
                        <UserPlus
                          className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)]"
                          aria-hidden
                        />
                      )}
                    </>
                  );

                  if (canInvite) {
                    return (
                      <button
                        key={u.id}
                        type="button"
                        aria-label={`Invite ${u.username}`}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left outline-none transition hover:bg-[var(--surface-muted)] focus-visible:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-inset"
                        onClick={() => handleInviteUser(u.id, u.username)}
                      >
                        {rowInner}
                      </button>
                    );
                  }

                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      {rowInner}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Invite by email */}
          <form onSubmit={handleInviteEmail} className="mt-4">
            <textarea
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Or invite by email (comma or newline separated)"
              rows={2}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
            />
            <div className="mt-3 flex items-center gap-3">
              <Button
                type="submit"
                disabled={sending || !emailInput.trim()}
                size="sm"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {sending ? "Sending..." : "Send Invites"}
              </Button>
              {inviteStatus && (
                <span className="text-sm text-[var(--text-secondary)]">
                  {inviteStatus}
                </span>
              )}
            </div>
          </form>

          {/* Pending Invitations */}
          {pendingInvites.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                Pending Invitations ({pendingInvites.length})
              </h3>
              <div className="mt-2 divide-y divide-[var(--border)]">
                {pendingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <span className="text-sm text-[var(--text-primary)]">
                      {inv.username ?? inv.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCancelInvite(inv.id)}
                      className="rounded-md p-1.5 text-[var(--text-tertiary)] transition hover:bg-red-500/10 hover:text-red-500"
                      title="Cancel invitation"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Members grouped by user */}
      <div className="co-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Members ({members.length})
        </h2>

        <div className="mt-4 space-y-4">
          {userGroups.map((group) => {
            const label = group.human.agent?.username || group.human.agentId;
            const isHuman = group.human.agent?.type === "human";
            const isSelf = group.human.agent?.username === user?.username;

            return (
              <div
                key={group.human.agentId}
                className="rounded-xl border border-[var(--border)] p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-muted)]">
                      {group.human.agent?.photoURL ? (
                        <img
                          src={group.human.agent.photoURL}
                          alt={label}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
                          {label[0] ?? "?"}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            group.human.role === "admin"
                              ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                              : "bg-[var(--surface-muted)] text-[var(--text-secondary)]"
                          }`}
                        >
                          {group.human.role}
                        </span>
                        {isHuman ? (
                          <ShieldCheck className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                        ) : (
                          <Shield className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                        )}
                      </div>
                      {isHuman && group.agents.length > 0 && (
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {group.agents.length} agent
                          {group.agents.length !== 1 && "s"}
                        </span>
                      )}
                    </div>
                  </div>

                  {isAdmin && !isSelf && (
                    <button
                      type="button"
                      onClick={() => handleRemoveUserAndAgents(group)}
                      className="rounded-md p-1.5 text-[var(--text-tertiary)] transition hover:bg-red-500/10 hover:text-red-500"
                      title="Remove user and agents"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {group.agents.length > 0 && (
                  <div className="ml-12 mt-3 space-y-2">
                    {group.agents.map((a) => (
                      <div
                        key={a.agentId}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                          <span className="text-sm text-[var(--text-secondary)]">
                            {a.agent?.username || a.agentId}
                          </span>
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(a.agentId)}
                            className="rounded-md p-1 text-[var(--text-tertiary)] transition hover:bg-red-500/10 hover:text-red-500"
                            title="Remove agent"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {members.length === 0 && (
            <p className="py-4 text-center text-sm text-[var(--text-secondary)]">
              No members yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
