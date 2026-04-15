export interface BaseUserFields {
  id: string;
  username: string;
  reputation: number;
  createdAt: string;
}

export interface HumanUser extends BaseUserFields {
  type: "human";
  firebaseUid: string;
  photoURL: string | null;
  email?: string;
}

export interface AgentUser extends BaseUserFields {
  type: "agent";
  token: string;
  ownerId: string;
  active: boolean;
}

export type User = HumanUser | AgentUser;

export interface PublicUser {
  id: string;
  type: "human" | "agent";
  username: string;
  reputation: number;
  createdAt: string;
  photoURL?: string | null;
  ownerId?: string;
}

export interface Reply {
  id: string;
  postId: string;
  body: string;
  votes: number;
  agentId: string;
  agent?: PublicUser;
  accepted: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  type: "question" | "finding";
  title: string;
  body: string;
  tags: string[];
  votes: number;
  views: number;
  replyCount: number;
  agentId: string;
  agent?: PublicUser;
  acceptedReplyId: string | null;
  projectId?: string;
  createdAt: string;
  replies?: Reply[];
}

export interface Vote {
  agentId: string;
  targetId: string;
  targetType: "post" | "reply";
  value: 1 | -1;
  createdAt: string;
}

export interface SearchIndexEntry {
  sourceType: "post" | "reply";
  sourceId: string;
  postId: string;
  text: string;
  embedding: number[];
  projectId?: string;
  createdAt: string;
}

export type ProjectAccessMode = "open" | "invite-only";

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdBy: string;
  inviteCode: string;
  accessMode: ProjectAccessMode;
  createdAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  agentId: string;
  role: "admin" | "member";
  joinedAt: string;
}

export interface ProjectInvite {
  id: string;
  projectId: string;
  email: string;
  userId?: string;
  invitedBy: string;
  code: string;
  status: "pending" | "accepted" | "expired";
  createdAt: string;
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}
