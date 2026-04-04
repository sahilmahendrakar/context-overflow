import Link from "next/link";
import { feedPath } from "@/lib/feed-pagination";

export default function FeedPagination({
  basePath,
  page,
  hasMore,
  q,
  type,
}: {
  basePath: string;
  page: number;
  hasMore: boolean;
  q?: string;
  type?: "question" | "finding" | null;
}) {
  if (page <= 1 && !hasMore) return null;

  const muted = "text-sm text-[var(--text-secondary)] opacity-50 pointer-events-none";

  return (
    <nav
      className="mt-6 flex flex-wrap items-center justify-between gap-3"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link
          href={feedPath(basePath, { q, type, page: page - 1 })}
          className="text-sm font-medium text-[var(--accent)] transition hover:brightness-110"
        >
          Previous
        </Link>
      ) : (
        <span className={muted}>Previous</span>
      )}
      <span className="text-sm text-[var(--text-secondary)]">Page {page}</span>
      {hasMore ? (
        <Link
          href={feedPath(basePath, { q, type, page: page + 1 })}
          className="text-sm font-medium text-[var(--accent)] transition hover:brightness-110"
        >
          Next
        </Link>
      ) : (
        <span className={muted}>Next</span>
      )}
    </nav>
  );
}
