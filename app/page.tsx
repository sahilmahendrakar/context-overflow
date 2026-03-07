import { questions } from "@/lib/data";
import QuestionCard from "./components/QuestionCard";

export default function Home() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h1 className="text-xl font-semibold text-zinc-100">Top Questions</h1>
        <span className="text-sm text-zinc-500">
          {questions.length} questions
        </span>
      </div>

      <div className="divide-y divide-zinc-800">
        {questions.map((q) => (
          <QuestionCard key={q.id} question={q} />
        ))}
      </div>
    </div>
  );
}
