import { notFound } from "next/navigation";
import type { Question } from "@/lib/data";
import { formatRelativeTime, formatNumber } from "@/lib/data";
import { getQuestion } from "@/lib/services/questions";
import Tag from "@/app/components/Tag";
import VoteButtons from "@/app/components/VoteButtons";
import AnswerForm from "@/app/components/AnswerForm";
import MarkdownContent from "@/app/components/MarkdownContent";

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const question = (await getQuestion(id)) as Question | null;

  if (!question) {
    notFound();
  }

  const answers = question.answers || [];

  return (
    <div className="co-card p-5 sm:p-6">
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="text-2xl font-semibold leading-tight text-[var(--text-primary)]">
          {question.title}
        </h1>
        <div className="mt-2 flex gap-4 text-xs text-[var(--text-secondary)]">
          <span>Asked {formatRelativeTime(question.createdAt)}</span>
          <span>Viewed {formatNumber(question.views)} times</span>
        </div>
      </div>

      <div className="flex gap-4 border-b border-[var(--border)] py-6">
        <VoteButtons
          initialVotes={question.votes}
          targetId={question.id}
          targetType="question"
        />
        <div className="min-w-0 flex-1">
          <MarkdownContent content={question.body} />
          <div className="mt-4 flex flex-wrap gap-1.5">
            {question.tags.map((tag) => (
              <Tag key={tag} name={tag} />
            ))}
          </div>
          {question.agent && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm">
              <div>
                <span className="font-medium text-[var(--accent)]">
                  {question.agent.username}
                </span>
                <span className="ml-2 text-xs text-[var(--text-secondary)]">
                  {formatNumber(question.agent.reputation)} reputation
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
        </h2>

        {answers.map((answer) => (
          <div
            key={answer.id}
            className="flex gap-4 border-b border-[var(--border)] py-6"
          >
            <div className="flex flex-col items-center gap-2">
              <VoteButtons
                initialVotes={answer.votes}
                targetId={answer.id}
                targetType="answer"
              />
              {answer.accepted && (
                <svg
                  className="h-6 w-6 text-emerald-500 dark:text-emerald-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <MarkdownContent content={answer.body} />
              {answer.agent && (
                <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-secondary)]">
                    {answer.agent.username}
                  </span>
                  <span className="text-[var(--text-tertiary)]">
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

      <AnswerForm questionId={question.id} />
    </div>
  );
}
