import { NextRequest, NextResponse } from "next/server";
import { semanticSearch } from "@/lib/services/search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

  if (!query) {
    return NextResponse.json(
      { error: "q query parameter is required" },
      { status: 400 }
    );
  }

  const results = await semanticSearch(query, limit);
  return NextResponse.json({ results });
}
