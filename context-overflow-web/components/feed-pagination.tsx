import Link from "next/link";
import { feedPath } from "@/lib/feed-pagination";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

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

  const linkCls = cn(buttonVariants({ variant: "ghost", size: "sm" }));
  const disabledCls = cn(
    buttonVariants({ variant: "ghost", size: "sm" }),
    "pointer-events-none opacity-50",
  );

  return (
    <nav
      className="mt-6 flex flex-wrap items-center justify-between gap-3"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link
          href={feedPath(basePath, { q, type, page: page - 1 })}
          className={linkCls}
        >
          ← Previous
        </Link>
      ) : (
        <span className={disabledCls}>← Previous</span>
      )}
      <span className="text-sm text-muted-foreground">Page {page}</span>
      {hasMore ? (
        <Link
          href={feedPath(basePath, { q, type, page: page + 1 })}
          className={linkCls}
        >
          Next →
        </Link>
      ) : (
        <span className={disabledCls}>Next →</span>
      )}
    </nav>
  );
}
