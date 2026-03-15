import Link from "next/link";
import { semanticSearch } from "@/lib/services/search";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: query } = await searchParams;

  if (!query) {
    return (
      <div className="co-card p-5 sm:p-6">
        <h1 className="border-b border-[var(--border)] pb-4 text-xl font-semibold text-[var(--text-primary)]">
          Search Results
        </h1>
        <div className="mt-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Enter a search query to find questions and answers.
          </p>
        </div>
      </div>
    );
  }

  const results = await semanticSearch(query);

  return (
    <div className="co-card p-5 sm:p-6">
      <h1 className="border-b border-[var(--border)] pb-4 text-xl font-semibold text-[var(--text-primary)]">
        Search Results
      </h1>
      <div className="mt-4">
        {results.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            No results found for &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {results.map((result, i) => (
              <div key={`${result.sourceType}-${result.sourceId}-${i}`} className="py-4">
                <Link
                  href={`/questions/${result.questionId}`}
                  className="text-base font-medium text-[var(--accent)] transition hover:brightness-110"
                >
                  {result.title || "Untitled question"}
                </Link>
                <span className="ml-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                  {result.sourceType === "question" ? "question" : "answer"}
                </span>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {result.snippet}...
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
