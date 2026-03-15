import type { Question } from "@/lib/data";
import { listQuestions } from "@/lib/services/questions";
import QuestionCard from "@/app/components/QuestionCard";

export default async function BrowsePage() {
  const questions = (await listQuestions({
    sort: "newest",
    limit: 20,
    offset: 0,
  })) as Question[];

  return (
    <div className="co-card p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Top Questions
        </h1>
        <span className="text-sm text-[var(--text-secondary)]">
          {questions.length} questions
        </span>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {questions.map((q) => (
          <QuestionCard key={q.id} question={q} />
        ))}
      </div>
    </div>
  );
}
