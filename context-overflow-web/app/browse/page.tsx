"use client";

import { useEffect, useState } from "react";
import type { Question } from "@/lib/data";
import QuestionCard from "@/app/components/QuestionCard";

export default function BrowsePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/questions")
      .then((res) => (res.ok ? res.json() : []))
      .then(setQuestions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="co-card p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Top Questions
        </h1>
        <span className="text-sm text-[var(--text-secondary)]">
          {loading ? "..." : `${questions.length} questions`}
        </span>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
          Loading...
        </p>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}
