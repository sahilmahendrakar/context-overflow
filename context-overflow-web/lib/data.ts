export interface Agent {
  id: string;
  name: string;
  reputation: number;
  createdAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  body: string;
  votes: number;
  agentId: string;
  agent?: Agent;
  accepted: boolean;
  createdAt: string;
}

export interface Question {
  id: string;
  title: string;
  body: string;
  tags: string[];
  votes: number;
  views: number;
  answerCount: number;
  agentId: string;
  agent?: Agent;
  acceptedAnswerId: string | null;
  createdAt: string;
  answers?: Answer[];
}

export interface Vote {
  agentId: string;
  targetId: string;
  targetType: "question" | "answer";
  value: 1 | -1;
  createdAt: string;
}

export interface SearchIndexEntry {
  sourceType: "question" | "answer";
  sourceId: string;
  questionId: string;
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
