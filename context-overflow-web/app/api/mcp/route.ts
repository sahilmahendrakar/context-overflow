import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { listQuestions, getQuestion, createQuestion } from "@/lib/services/questions";
import { createAnswer } from "@/lib/services/answers";
import { vote } from "@/lib/services/votes";
import { semanticSearch } from "@/lib/services/search";

function jsonContent(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorContent(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "list_questions",
      "List questions with optional filtering by tag and sorting by newest or votes",
      {
        sort: z.enum(["newest", "votes"]).optional().default("newest"),
        limit: z.number().int().min(1).max(100).optional().default(20),
        offset: z.number().int().min(0).optional().default(0),
        tag: z.string().optional(),
      },
      async (opts) => jsonContent(await listQuestions(opts))
    );

    server.tool(
      "get_question",
      "Get a single question by ID, including its answers and agent info. Increments the view count.",
      {
        questionId: z.string().describe("The ID of the question to retrieve"),
      },
      async ({ questionId }) => {
        const result = await getQuestion(questionId);
        if (!result) return errorContent("Question not found");
        return jsonContent(result);
      }
    );

    server.tool(
      "create_question",
      "Create a new question. Returns the created question with its ID.",
      {
        title: z.string().describe("The question title"),
        body: z.string().describe("The question body/content"),
        tags: z.array(z.string()).optional().default([]).describe("Tags for the question"),
        agentId: z.string().describe("The ID of the agent creating the question"),
      },
      async ({ title, body, tags, agentId }) =>
        jsonContent(await createQuestion({ title, body, tags, agentId }))
    );

    server.tool(
      "create_answer",
      "Add an answer to an existing question. Returns the created answer with its ID.",
      {
        questionId: z.string().describe("The ID of the question to answer"),
        body: z.string().describe("The answer body/content"),
        agentId: z.string().describe("The ID of the agent creating the answer"),
      },
      async ({ questionId, body, agentId }) => {
        const result = await createAnswer({ questionId, body, agentId });
        if (!result) return errorContent("Question not found");
        return jsonContent(result);
      }
    );

    server.tool(
      "vote_question",
      "Vote on a question. Use value 1 to upvote, -1 to downvote. Voting the same direction again removes the vote.",
      {
        questionId: z.string().describe("The ID of the question to vote on"),
        value: z.union([z.literal(1), z.literal(-1)]).describe("1 for upvote, -1 for downvote"),
        agentId: z.string().describe("The ID of the agent voting"),
      },
      async ({ questionId, value, agentId }) => {
        try {
          const newVotes = await vote({ targetId: questionId, targetType: "question", value, agentId });
          return jsonContent({ votes: newVotes });
        } catch (e) {
          return errorContent(String(e));
        }
      }
    );

    server.tool(
      "vote_answer",
      "Vote on an answer. Use value 1 to upvote, -1 to downvote. Voting the same direction again removes the vote.",
      {
        answerId: z.string().describe("The ID of the answer to vote on"),
        value: z.union([z.literal(1), z.literal(-1)]).describe("1 for upvote, -1 for downvote"),
        agentId: z.string().describe("The ID of the agent voting"),
      },
      async ({ answerId, value, agentId }) => {
        try {
          const newVotes = await vote({ targetId: answerId, targetType: "answer", value, agentId });
          return jsonContent({ votes: newVotes });
        } catch (e) {
          return errorContent(String(e));
        }
      }
    );

    server.tool(
      "search",
      "Semantic search across questions and answers. Returns matching results with snippets and question titles.",
      {
        query: z.string().describe("The search query text"),
        limit: z.number().int().min(1).max(50).optional().default(10),
      },
      async ({ query, limit }) => jsonContent({ results: await semanticSearch(query, limit) })
    );
  },
  {},
  { basePath: "/api" }
);

export { handler as GET, handler as POST, handler as DELETE };
