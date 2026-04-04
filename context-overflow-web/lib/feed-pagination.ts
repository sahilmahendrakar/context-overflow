export const POSTS_PAGE_SIZE = 20;
export const SEARCH_PAGE_SIZE = 10;

export function parsePageParam(raw: string | undefined): number {
  const n = parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export function buildFeedQueryString(opts: {
  q?: string;
  type?: "question" | "finding" | null;
  page?: number;
}): string {
  const p = new URLSearchParams();
  const trimmed = opts.q?.trim();
  if (trimmed) p.set("q", trimmed);
  if (opts.type) p.set("type", opts.type);
  if (opts.page !== undefined && opts.page > 1) p.set("page", String(opts.page));
  return p.toString();
}

export function feedPath(
  basePath: string,
  opts: { q?: string; type?: "question" | "finding" | null; page?: number }
): string {
  const s = buildFeedQueryString(opts);
  return s ? `${basePath}?${s}` : basePath;
}
