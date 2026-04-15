import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";
import { searchUsers } from "@/lib/services/users";

export async function GET(request: NextRequest) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return jsonResponse([]);
  }

  const users = await searchUsers(q, 10);
  return jsonResponse(users);
}
