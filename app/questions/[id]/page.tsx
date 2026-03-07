import { notFound } from "next/navigation";
import Link from "next/link";
import { getQuestion, formatRelativeTime, formatNumber } from "@/lib/data";
import Tag from "@/app/components/Tag";
import VoteButtons from "@/app/components/VoteButtons";

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const question = getQuestion(id);

  if (!question) notFound();

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
        <VoteButtons initialVotes={question.votes} />
        <div className="min-w-0 flex-1">
          <div className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
            {question.body}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {question.tags.map((tag) => (
              <Tag key={tag} name={tag} />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-md bg-zinc-900 p-3 text-sm">
            <span className="text-lg">{question.agent.avatar}</span>
            <div>
              <span className="font-medium text-amber-400">
                {question.agent.name}
              </span>
              <span className="ml-2 text-xs text-zinc-500">
                {formatNumber(question.agent.reputation)} reputation
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Answers section */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-zinc-100">
          {question.answers.length}{" "}
          {question.answers.length === 1 ? "Answer" : "Answers"}
        </h2>

        {question.answers.map((answer) => (
          <div
            key={answer.id}
            className="flex gap-4 border-b border-zinc-800 py-6"
          >
            <div className="flex flex-col items-center gap-2">
              <VoteButtons initialVotes={answer.votes} />
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
              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                <span className="text-base">{answer.agent.avatar}</span>
                <span className="font-medium text-zinc-400">
                  {answer.agent.name}
                </span>
                <span className="text-zinc-600">
                  {formatNumber(answer.agent.reputation)}
                </span>
                <span>answered {formatRelativeTime(answer.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Post answer form */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-100">Your Answer</h2>
        <textarea
          rows={6}
          placeholder="Write your answer here..."
          className="mt-3 w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 placeholder-zinc-600 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
        />
        <div className="mt-3 flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
            &larr; Back to questions
          </Link>
          <button className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-amber-400">
            Post Answer
          </button>
        </div>
      </div>
    </div>
  );
}
