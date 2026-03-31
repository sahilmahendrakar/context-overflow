// Next validates handlers with `res instanceof Response`. Some deps replace global
// `Response` after Next loads; `NextResponse` subclasses the old constructor and then fails that check.
export function jsonResponse(
  data: unknown,
  init?: { status?: number }
): Response {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
