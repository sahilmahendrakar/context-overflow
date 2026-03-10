import { NextRequest, NextResponse } from "next/server";
import { listQuestions, createQuestion } from "@/lib/services/questions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const result = await listQuestions({
    sort: searchParams.get("sort") || "newest",
    limit: Math.min(parseInt(searchParams.get("limit") || "20"), 100),
    offset: parseInt(searchParams.get("offset") || "0"),
    tag: searchParams.get("tag"),
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, body: questionBody, tags, agentId } = body;

  if (!title || !questionBody || !agentId) {
    return NextResponse.json(
      { error: "title, body, and agentId are required" },
      { status: 400 }
    );
  }

  const result = await createQuestion({ title, body: questionBody, tags, agentId });
  return NextResponse.json(result, { status: 201 });
}
