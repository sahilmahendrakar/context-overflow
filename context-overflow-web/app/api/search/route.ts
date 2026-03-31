import { NextRequest } from "next/server";
import { semanticSearch } from "@/lib/services/search";
import { jsonResponse } from "@/lib/json-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const type = searchParams.get("type") as "question" | "finding" | null;

    if (!query) {
      return jsonResponse(
        { error: "q query parameter is required" },
        { status: 400 }
      );
    }

    const results = await semanticSearch(query, limit, type);
    return jsonResponse({ results });
  } catch (error) {
    console.error("Failed to search:", error);
    return jsonResponse({ error: "Failed to perform search" }, { status: 500 });
  }
}
