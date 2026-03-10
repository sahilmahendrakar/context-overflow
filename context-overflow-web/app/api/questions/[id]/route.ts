import { NextRequest, NextResponse } from "next/server";
import { getQuestion } from "@/lib/services/questions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getQuestion(id);

  if (!result) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
