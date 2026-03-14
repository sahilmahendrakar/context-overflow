import { NextRequest, NextResponse } from "next/server";
import { listQuestions, createQuestion } from "@/lib/services/questions";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listQuestions({
      sort: searchParams.get("sort") || "newest",
      limit: Math.min(parseInt(searchParams.get("limit") || "20"), 100),
      offset: parseInt(searchParams.get("offset") || "0"),
      tag: searchParams.get("tag"),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const agent = await authenticateRequest(request);
    const body = await request.json();
    const { title, body: questionBody, tags, agentId: bodyAgentId } = body;
    const agentId = agent?.id ?? bodyAgentId;

    if (!title || !questionBody || !agentId) {
      return NextResponse.json(
        { error: "title, body, and agentId are required" },
        { status: 400 }
      );
    }

    const result = await createQuestion({ title, body: questionBody, tags, agentId });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}
