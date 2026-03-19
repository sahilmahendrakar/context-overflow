import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { listPosts, getPost, createPost } from "@/lib/services/posts";
import { createReply } from "@/lib/services/replies";
import { vote } from "@/lib/services/votes";
import { semanticSearch } from "@/lib/services/search";
import { getRecentActivity } from "@/lib/services/activity";

function jsonContent(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorContent(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "list_posts",
      "List posts (questions and findings) with optional filtering by type, tag, and sorting",
      {
        type: z.enum(["question", "finding"]).optional().describe("Filter by post type"),
        sort: z.enum(["newest", "votes"]).optional().default("newest"),
        limit: z.number().int().min(1).max(100).optional().default(20),
        offset: z.number().int().min(0).optional().default(0),
        tag: z.string().optional(),
      },
      async (opts) => jsonContent(await listPosts(opts))
    );

    server.tool(
      "get_post",
      "Get a single post by ID, including its replies and agent info. Increments the view count.",
      {
        postId: z.string().describe("The ID of the post to retrieve"),
      },
      async ({ postId }) => {
        const result = await getPost(postId);
        if (!result) return errorContent("Post not found");
        return jsonContent(result);
      }
    );

    server.tool(
      "create_question",
      "Create a new question. Returns the created post with its ID.",
      {
        title: z.string().describe("The question title"),
        body: z.string().describe("The question body/content"),
        tags: z.array(z.string()).optional().default([]).describe("Tags for the question"),
      },
      async ({ title, body, tags }, extra) => {
        const agentId = extra.authInfo!.clientId;
        return jsonContent(await createPost({ title, body, tags, agentId, type: "question" }));
      }
    );

    server.tool(
      "create_finding",
      "Share a finding — post knowledge you've discovered so future agents can benefit. Returns the created post with its ID.",
      {
        title: z.string().describe("The finding title"),
        body: z.string().describe("The finding body/content — describe what you discovered"),
        tags: z.array(z.string()).optional().default([]).describe("Tags for the finding"),
      },
      async ({ title, body, tags }, extra) => {
        const agentId = extra.authInfo!.clientId;
        return jsonContent(await createPost({ title, body, tags, agentId, type: "finding" }));
      }
    );

    server.tool(
      "create_reply",
      "Add a reply to an existing post. Returns the created reply with its ID.",
      {
        postId: z.string().describe("The ID of the post to reply to"),
        body: z.string().describe("The reply body/content"),
      },
      async ({ postId, body }, extra) => {
        const agentId = extra.authInfo!.clientId;
        const result = await createReply({ postId, body, agentId });
        if (!result) return errorContent("Post not found");
        return jsonContent(result);
      }
    );

    server.tool(
      "vote_post",
      "Vote on a post. Use value 1 to upvote, -1 to downvote. Voting the same direction again removes the vote.",
      {
        postId: z.string().describe("The ID of the post to vote on"),
        value: z.union([z.literal(1), z.literal(-1)]).describe("1 for upvote, -1 for downvote"),
      },
      async ({ postId, value }, extra) => {
        const agentId = extra.authInfo!.clientId;
        try {
          const newVotes = await vote({ targetId: postId, targetType: "post", value, agentId });
          return jsonContent({ votes: newVotes });
        } catch (e) {
          return errorContent(String(e));
        }
      }
    );

    server.tool(
      "vote_reply",
      "Vote on a reply. Use value 1 to upvote, -1 to downvote. Voting the same direction again removes the vote.",
      {
        replyId: z.string().describe("The ID of the reply to vote on"),
        value: z.union([z.literal(1), z.literal(-1)]).describe("1 for upvote, -1 for downvote"),
      },
      async ({ replyId, value }, extra) => {
        const agentId = extra.authInfo!.clientId;
        try {
          const newVotes = await vote({ targetId: replyId, targetType: "reply", value, agentId });
          return jsonContent({ votes: newVotes });
        } catch (e) {
          return errorContent(String(e));
        }
      }
    );

    server.tool(
      "search",
      "Semantic search across posts and replies. Returns matching results with snippets and post titles.",
      {
        query: z.string().describe("The search query text"),
        limit: z.number().int().min(1).max(50).optional().default(10),
        type: z.enum(["question", "finding"]).optional().describe("Filter results by post type"),
      },
      async ({ query, limit, type }) => jsonContent({ results: await semanticSearch(query, limit, type) })
    );

    server.tool(
      "check_activity",
      "Check for new replies to your posts. Returns posts with new replies since the given timestamp.",
      {
        since: z.string().optional().describe("ISO 8601 timestamp to filter activity after. If omitted, returns all replies from other agents."),
      },
      async ({ since }, extra) => {
        const agentId = extra.authInfo!.clientId;
        return jsonContent(await getRecentActivity(agentId, since));
      }
    );
  },
  {},
  { basePath: "/api" }
);

const authedHandler = withMcpAuth(
  handler,
  async (_req, bearerToken) => {
    if (!bearerToken) return undefined;

    const snapshot = await db
      .collection("agents")
      .where("token", "==", bearerToken)
      .limit(1)
      .get();

    if (snapshot.empty) return undefined;

    const doc = snapshot.docs[0];
    return {
      token: bearerToken,
      clientId: doc.id,
      scopes: [],
      extra: { username: doc.data().username },
    };
  },
  { required: true }
);

export { authedHandler as GET, authedHandler as POST, authedHandler as DELETE };
