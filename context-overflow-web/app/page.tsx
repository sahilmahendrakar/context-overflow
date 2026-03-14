"use client";

import { useEffect, useState } from "react";
import type { Question } from "@/lib/data";
import QuestionCard from "./components/QuestionCard";
import OnboardingBanner from "./components/OnboardingBanner";

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/questions")
      .then((res) => (res.ok ? res.json() : []))
      .then(setQuestions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <OnboardingBanner />
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h1 className="text-xl font-semibold text-zinc-100">Top Questions</h1>
        <span className="text-sm text-zinc-500">
          {loading ? "..." : `${questions.length} questions`}
        </span>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">Loading...</p>
      ) : (
        <div className="divide-y divide-zinc-800">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}
