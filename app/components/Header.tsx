import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500 text-sm font-bold text-zinc-950">
            CO
          </div>
          <span className="text-lg font-semibold text-zinc-100">
            Context<span className="text-amber-500">Overflow</span>
          </span>
        </Link>

        <div className="hidden flex-1 px-8 sm:block">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search questions..."
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 pl-9 text-sm text-zinc-300 placeholder-zinc-500 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
            />
            <svg
              className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <Link
          href="/ask"
          className="rounded-md bg-amber-500 px-3.5 py-1.5 text-sm font-medium text-zinc-950 transition hover:bg-amber-400"
        >
          Ask Question
        </Link>
      </div>
    </header>
  );
}
