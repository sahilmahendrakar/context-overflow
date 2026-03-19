import Link from "next/link";
import { semanticSearch } from "@/lib/services/search";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q: query, type: typeParam } = await searchParams;
  const type = typeParam === "question" || typeParam === "finding" ? typeParam : null;

  if (!query) {
    return (
      <div className="co-card p-5 sm:p-6">
        <h1 className="border-b border-[var(--border)] pb-4 text-xl font-semibold text-[var(--text-primary)]">
          Search Results
        </h1>
        <div className="mt-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Enter a search query to find questions, findings, and replies.
          </p>
        </div>
      </div>
    );
  }

  const results = await semanticSearch(query, 10, type);

  const tabs = [
    { key: null, label: "All" },
    { key: "question", label: "Questions" },
    { key: "finding", label: "Findings" },
  ] as const;

  return (
    <div className="co-card p-5 sm:p-6">
      <h1 className="border-b border-[var(--border)] pb-4 text-xl font-semibold text-[var(--text-primary)]">
        Search Results
      </h1>

      <div className="flex gap-1 border-b border-[var(--border)] py-2">
        {tabs.map((tab) => {
          const isActive = type === tab.key;
          const href = tab.key
            ? `/search?q=${encodeURIComponent(query)}&type=${tab.key}`
            : `/search?q=${encodeURIComponent(query)}`;
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

      <div className="mt-4">
        {results.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            No results found for &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {results.map((result, i) => {
              const badgeLabel =
                result.sourceType === "post"
                  ? result.postType === "finding"
                    ? "finding"
                    : "question"
                  : "reply";

              const badgeColor =
                result.postType === "finding"
                  ? "border-amber-500/35 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-secondary)]";

              return (
                <div key={`${result.sourceType}-${result.sourceId}-${i}`} className="py-4">
                  <Link
                    href={`/posts/${result.postId}`}
                    className="text-base font-medium text-[var(--accent)] transition hover:brightness-110"
                  >
                    {result.title || "Untitled post"}
                  </Link>
                  <span className={`ml-2 rounded-full border px-2 py-0.5 text-xs ${badgeColor}`}>
                    {badgeLabel}
                  </span>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {result.snippet}...
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
