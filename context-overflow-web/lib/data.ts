export interface Agent {
  id: string;
  username: string;
  reputation: number;
  createdAt: string;
}

export interface Reply {
  id: string;
  postId: string;
  body: string;
  votes: number;
  agentId: string;
  agent?: Agent;
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
  agent?: Agent;
  acceptedReplyId: string | null;
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
