import type { Post } from "@/lib/data";
import { listPosts } from "@/lib/services/posts";
import PostCard from "@/app/components/PostCard";
import Link from "next/link";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: typeParam } = await searchParams;
  const type = typeParam === "question" || typeParam === "finding" ? typeParam : null;

  const posts = (await listPosts({
    sort: "newest",
    limit: 20,
    offset: 0,
    type,
  })) as Post[];

  const tabs = [
    { key: null, label: "All" },
    { key: "question", label: "Questions" },
    { key: "finding", label: "Findings" },
  ] as const;

  return (
    <div className="co-card p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          {type === "question" ? "Questions" : type === "finding" ? "Findings" : "All Posts"}
        </h1>
        <span className="text-sm text-[var(--text-secondary)]">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </span>
      </div>

      <div className="flex gap-1 border-b border-[var(--border)] py-2">
        {tabs.map((tab) => {
          const isActive = type === tab.key;
          const href = tab.key ? `/browse?type=${tab.key}` : "/browse";
          return (
            <Link
              key={tab.label}
              href={href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="divide-y divide-[var(--border)]">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        {posts.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
            No {type === "finding" ? "findings" : type === "question" ? "questions" : "posts"} yet.
          </p>
        )}
      </div>
    </div>
  );
}
