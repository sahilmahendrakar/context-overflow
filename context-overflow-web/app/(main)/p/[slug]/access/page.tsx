"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import { useProject } from "../ProjectContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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

  const [savingMode, setSavingMode] = useState(false);

  const authHeaders = useCallback(async () => {
    const token = await getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : null;
  }, [getIdToken]);

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

    const groupedAgentIds = new Set(
      groups.flatMap((g) => g.agents.map((a) => a.agentId)),
    );
    const ungroupedAgents = agentMembers.filter(
      (a) => !groupedAgentIds.has(a.agentId),
    );

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
    if (res.ok) {
      setAccessMode(mode);
      toast.success("Access mode updated");
    }
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
      toast.success("Invite code regenerated");
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
    const res = await fetch(
      `/api/users/search?q=${encodeURIComponent(q)}`,
      { headers },
    );
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
    toast.success(`Invited ${username}`);
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
      toast.success(parts.join(". ") || "Invites sent");
      setEmailInput("");
      void fetchMembers();
      void fetchInvites();
    } else {
      toast.error("Failed to send invites");
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
      <p className="py-8 text-center text-sm text-muted-foreground">
        Loading...
      </p>
    );
  }

  const joinCommand =
    accessMode === "invite-only"
      ? `cxo join-project ${project.slug}`
      : `cxo join-project ${project.slug} --code ${inviteCode}`;

  return (
    <div className="space-y-6">
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Access Mode</CardTitle>
            <CardDescription>
              Control how agents join this project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    mode: "open" as const,
                    icon: Globe,
                    title: "Anyone with invite code",
                    desc: "Any agent with the invite code can join.",
                  },
                  {
                    mode: "invite-only" as const,
                    icon: Lock,
                    title: "Invite only",
                    desc: "Only invited users' agents can join by project slug.",
                  },
                ] as const
              ).map(({ mode, icon: Icon, title, desc }) => (
                <button
                  key={mode}
                  type="button"
                  disabled={savingMode}
                  onClick={() => handleAccessModeChange(mode)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 text-left transition",
                    accessMode === mode
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground",
                  )}
                >
                  <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <div className="text-sm font-medium text-foreground">{title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-muted p-4">
              <p className="text-sm font-medium text-foreground">
                Connect your coding agent:
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="rounded-lg bg-background px-3 py-1.5 font-mono text-xs text-foreground">
                  {joinCommand}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={copyJoinCommand}
                  title="Copy command"
                >
                  <Copy className="size-4" />
                </Button>
                {copied && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    Copied!
                  </span>
                )}
              </div>
            </div>

            {accessMode === "open" && (
              <Button variant="ghost" size="sm" onClick={handleRegenerateCode}>
                <RefreshCw className="mr-1.5 size-3.5" />
                Regenerate invite code
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Setup</CardTitle>
            <CardDescription>
              Run this command in your project directory to connect your coding
              agent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border bg-muted p-4">
              <div className="flex items-center gap-2">
                <code className="rounded-lg bg-background px-3 py-1.5 font-mono text-xs text-foreground">
                  {joinCommand}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={copyJoinCommand}
                >
                  <Copy className="size-4" />
                </Button>
                {copied && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    Copied!
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  placeholder="Search by username..."
                  className="pl-10"
                />
                {searching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Searching...
                  </span>
                )}
              </div>

              {showResults && searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
                  {searchResults.map((u) => {
                    const alreadyMember = members.some((m) => m.agentId === u.id);
                    const alreadyInvited = pendingInvites.some(
                      (inv) => inv.userId === u.id,
                    );
                    const canInvite = !alreadyMember && !alreadyInvited;

                    const rowInner = (
                      <>
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                            {u.photoURL ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={u.photoURL}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="size-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-semibold uppercase text-muted-foreground">
                                {u.username[0]}
                              </span>
                            )}
                          </div>
                          <span className="truncate text-sm text-foreground">
                            {u.username}
                          </span>
                        </div>
                        {alreadyMember ? (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            Already a member
                          </span>
                        ) : alreadyInvited ? (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            Invite pending
                          </span>
                        ) : (
                          <UserPlus className="size-3.5 shrink-0 text-muted-foreground" />
                        )}
                      </>
                    );

                    if (canInvite) {
                      return (
                        <button
                          key={u.id}
                          type="button"
                          aria-label={`Invite ${u.username}`}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left outline-none transition hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
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

            <form onSubmit={handleInviteEmail} className="space-y-3">
              <Textarea
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Or invite by email (comma or newline separated)"
                rows={2}
              />
              <Button type="submit" disabled={sending || !emailInput.trim()} size="sm">
                <Send className="mr-1.5 size-3.5" />
                {sending ? "Sending..." : "Send Invites"}
              </Button>
            </form>

            {pendingInvites.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Pending Invitations ({pendingInvites.length})
                </h3>
                <div className="mt-2 divide-y divide-border">
                  {pendingInvites.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-2.5"
                    >
                      <span className="text-sm text-foreground">
                        {inv.username ?? inv.email}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleCancelInvite(inv.id)}
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Cancel invitation"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {userGroups.map((group) => {
            const label = group.human.agent?.username || group.human.agentId;
            const isHuman = group.human.agent?.type === "human";
            const isSelf = group.human.agent?.username === user?.username;

            return (
              <div
                key={group.human.agentId}
                className="rounded-xl border border-border p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                      {group.human.agent?.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={group.human.agent.photoURL}
                          alt={label}
                          referrerPolicy="no-referrer"
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          {label[0] ?? "?"}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {label}
                        </span>
                        <Badge
                          variant={
                            group.human.role === "admin" ? "info" : "neutral"
                          }
                        >
                          {group.human.role}
                        </Badge>
                        {isHuman ? (
                          <ShieldCheck className="size-3.5 text-muted-foreground" />
                        ) : (
                          <Shield className="size-3.5 text-muted-foreground" />
                        )}
                      </div>
                      {isHuman && group.agents.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {group.agents.length} agent
                          {group.agents.length !== 1 && "s"}
                        </span>
                      )}
                    </div>
                  </div>

                  {isAdmin && !isSelf && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveUserAndAgents(group)}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Remove user and agents"
                    >
                      <Trash2 className="size-4" />
                    </Button>
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
                          <Shield className="size-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {a.agent?.username || a.agentId}
                          </span>
                        </div>
                        {isAdmin && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveMember(a.agentId)}
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title="Remove agent"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {members.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No members yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
