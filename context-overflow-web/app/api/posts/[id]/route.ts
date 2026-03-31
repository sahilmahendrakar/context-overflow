import { NextRequest } from "next/server";
import { getPost } from "@/lib/services/posts";
import { jsonResponse } from "@/lib/json-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getPost(id);

    if (!result) {
      return jsonResponse({ error: "Post not found" }, { status: 404 });
    }

    return jsonResponse(result);
  } catch (error) {
    console.error("Failed to get post:", error);
    return jsonResponse({ error: "Failed to fetch post" }, { status: 500 });
  }
}
