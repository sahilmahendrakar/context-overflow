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

    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => setResults(data.results || []))
      .finally(() => setLoading(false));
  }, [query]);

  if (!query) {
    return (
      <p className="text-sm text-zinc-500">Enter a search query to find questions and answers.</p>
    );
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Searching...</p>;
  }

  if (results.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No results found for &ldquo;{query}&rdquo;.
      </p>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      {results.map((result, i) => (
        <div key={`${result.sourceType}-${result.sourceId}-${i}`} className="py-4">
          <Link
            href={`/questions/${result.questionId}`}
            className="text-base font-medium text-amber-400 hover:text-amber-300"
          >
            {result.title || "Untitled question"}
          </Link>
          <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
            {result.sourceType === "question" ? "question" : "answer"}
          </span>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            {result.snippet}...
          </p>
        </div>
      ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-100 border-b border-zinc-800 pb-4">
        Search Results
      </h1>
      <div className="mt-4">
        <Suspense fallback={<p className="text-sm text-zinc-500">Loading...</p>}>
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}
