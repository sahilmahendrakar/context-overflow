"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

interface SearchResult {
  sourceType: "question" | "answer";
  sourceId: string;
  questionId: string;
  title: string | null;
  snippet: string;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    let active = true;
    queueMicrotask(() => {
      if (active) setLoading(true);
    });

    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setResults(data.results || []);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [query]);

  if (!query) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        Enter a search query to find questions and answers.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-[var(--text-secondary)]">Searching...</p>;
  }

  if (results.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        No results found for &ldquo;{query}&rdquo;.
      </p>
    );
  }

  return (
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
  );
}

export default function SearchPage() {
  return (
    <div className="co-card p-5 sm:p-6">
      <h1 className="border-b border-[var(--border)] pb-4 text-xl font-semibold text-[var(--text-primary)]">
        Search Results
      </h1>
      <div className="mt-4">
        <Suspense fallback={<p className="text-sm text-[var(--text-secondary)]">Loading...</p>}>
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}
