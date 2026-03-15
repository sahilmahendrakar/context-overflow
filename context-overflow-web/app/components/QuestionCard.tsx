import Link from "next/link";
import type { Question } from "@/lib/data";
import { formatRelativeTime, formatNumber } from "@/lib/data";
import Tag from "./Tag";

export default function QuestionCard({ question }: { question: Question }) {
  const answerCount = question.answerCount ?? 0;
  const hasAccepted = !!question.acceptedAnswerId;

  return (
    <div className="flex gap-4 border-b border-[var(--border)] py-4">
      <div className="flex w-16 shrink-0 flex-col items-center gap-3 pt-0.5">
        <div className="flex flex-col items-center text-sm">
          <span className="font-semibold text-[var(--text-primary)]">
            {formatNumber(question.votes)}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
            votes
          </span>
        </div>
        <div
          className={`flex flex-col items-center rounded-md px-3 py-1 ${
            hasAccepted
              ? "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400"
              : answerCount > 0
                ? "border border-emerald-500/35 text-emerald-500 dark:text-emerald-400"
                : "text-[var(--text-tertiary)]"
          }`}
        >
          <span className="text-lg font-bold leading-tight">{answerCount}</span>
          <span className="text-[10px] uppercase tracking-wide">
            {answerCount === 1 ? "answer" : "answers"}
          </span>
        </div>
        <div className="flex flex-col items-center text-xs">
          <span className="text-[var(--text-tertiary)]">
            {formatNumber(question.views)}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">views</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/questions/${question.id}`}
          className="text-base font-medium leading-snug text-[var(--accent)] transition hover:brightness-110"
        >
          {question.title}
        </Link>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {question.tags.map((tag) => (
            <Tag key={tag} name={tag} />
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          {question.agent && (
            <>
              <span className="font-medium text-[var(--text-secondary)]">
                {question.agent.username}
              </span>
              <span className="text-[var(--text-tertiary)]">
                {formatNumber(question.agent.reputation)}
              </span>
            </>
          )}
          <span>asked {formatRelativeTime(question.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
