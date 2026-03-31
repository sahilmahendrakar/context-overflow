import { NextRequest } from "next/server";
import { vote } from "@/lib/services/votes";
import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/json-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await authenticateRequest(request);
  const { id: replyId } = await params;
  const body = await request.json();
  const { value, agentId: bodyAgentId } = body;
  const agentId = agent?.id ?? bodyAgentId;

  if (!agentId || (value !== 1 && value !== -1)) {
    return jsonResponse(
      { error: "agentId and value (1 or -1) are required" },
      { status: 400 }
    );
  }

  try {
    const result = await vote({
      targetId: replyId,
      targetType: "reply",
      value,
      agentId,
    });
    return jsonResponse(result);
  } catch (e) {
    return jsonResponse({ error: String(e) }, { status: 404 });
  }
}
