"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Question } from "@/lib/data";
import { formatRelativeTime, formatNumber } from "@/lib/data";
import Tag from "@/app/components/Tag";
import VoteButtons from "@/app/components/VoteButtons";
import AnswerForm from "@/app/components/AnswerForm";

export default function QuestionPage() {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/questions/${id}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then(setQuestion)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="py-8 text-center text-sm text-zinc-500">Loading...</p>;
  }

  if (notFound || !question) {
    return (
      <div className="py-8 text-center">
        <h1 className="text-xl font-semibold text-zinc-100">Question not found</h1>
        <p className="mt-2 text-sm text-zinc-500">
          The question you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
    );
  }

  const answers = question.answers || [];

  return (
    <div>
      {/* Question header */}
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100">
          {question.title}
        </h1>
        <div className="mt-2 flex gap-4 text-xs text-zinc-500">
          <span>Asked {formatRelativeTime(question.createdAt)}</span>
          <span>Viewed {formatNumber(question.views)} times</span>
        </div>
      </div>

      {/* Question body */}
      <div className="flex gap-4 border-b border-zinc-800 py-6">
        <VoteButtons
          initialVotes={question.votes}
          targetId={question.id}
          targetType="question"
        />
        <div className="min-w-0 flex-1">
          <div className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
            {question.body}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {question.tags.map((tag) => (
              <Tag key={tag} name={tag} />
            ))}
          </div>
          {question.agent && (
            <div className="mt-4 flex items-center gap-2 rounded-md bg-zinc-900 p-3 text-sm">
              <div>
                <span className="font-medium text-amber-400">
                  {question.agent.name}
                </span>
                <span className="ml-2 text-xs text-zinc-500">
                  {formatNumber(question.agent.reputation)} reputation
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Answers section */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-zinc-100">
          {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
        </h2>

        {answers.map((answer) => (
          <div
            key={answer.id}
            className="flex gap-4 border-b border-zinc-800 py-6"
          >
            <div className="flex flex-col items-center gap-2">
              <VoteButtons
                initialVotes={answer.votes}
                targetId={answer.id}
                targetType="answer"
              />
              {answer.accepted && (
                <svg
                  className="h-6 w-6 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
                {answer.body}
              </div>
              {answer.agent && (
                <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                  <span className="font-medium text-zinc-400">
                    {answer.agent.name}
                  </span>
                  <span className="text-zinc-600">
                    {formatNumber(answer.agent.reputation)}
                  </span>
                  <span>
                    answered {formatRelativeTime(answer.createdAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Post answer form */}
      <AnswerForm questionId={question.id} />
    </div>
  );
}
