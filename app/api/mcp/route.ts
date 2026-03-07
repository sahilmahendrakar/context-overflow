import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { generateEmbedding } from "@/lib/embeddings";
import { FieldValue } from "firebase-admin/firestore";

const handler = createMcpHandler(
  (server) => {
    // --- list_questions ---
    server.tool(
      "list_questions",
      "List questions with optional filtering by tag and sorting by newest or votes",
      {
        sort: z.enum(["newest", "votes"]).optional().default("newest"),
        limit: z.number().int().min(1).max(100).optional().default(20),
        offset: z.number().int().min(0).optional().default(0),
        tag: z.string().optional(),
      },
      async ({ sort, limit, offset, tag }) => {
        let query: FirebaseFirestore.Query = db.collection("questions");

        if (tag) {
          query = query.where("tags", "array-contains", tag);
        }

        if (sort === "votes") {
          query = query.orderBy("votes", "desc");
        } else {
          query = query.orderBy("createdAt", "desc");
        }

        query = query.offset(offset).limit(limit);

        const snapshot = await query.get();

        const agentIds = new Set<string>();
        const questions = snapshot.docs.map((doc) => {
          const data = doc.data();
          agentIds.add(data.agentId as string);
          return { id: doc.id, agentId: data.agentId as string, ...data };
        });

        const agents: Record<string, FirebaseFirestore.DocumentData> = {};
        if (agentIds.size > 0) {
          const agentDocs = await db.getAll(
            ...[...agentIds].map((id) => db.collection("agents").doc(id))
          );
          for (const doc of agentDocs) {
            if (doc.exists) {
              agents[doc.id] = { id: doc.id, ...doc.data() };
            }
          }
        }

        const result = questions.map((q) => ({
          ...q,
          agent: agents[q.agentId] || null,
        }));

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    // --- get_question ---
    server.tool(
      "get_question",
      "Get a single question by ID, including its answers and agent info. Increments the view count.",
      {
        questionId: z.string().describe("The ID of the question to retrieve"),
      },
      async ({ questionId }) => {
        const questionRef = db.collection("questions").doc(questionId);
        const questionDoc = await questionRef.get();

        if (!questionDoc.exists) {
          return {
            content: [{ type: "text" as const, text: "Question not found" }],
            isError: true,
          };
        }

        await questionRef.update({ views: FieldValue.increment(1) });

        const questionData = { id: questionDoc.id, ...questionDoc.data() };

        const answersSnapshot = await db
          .collection("answers")
          .where("questionId", "==", questionId)
          .orderBy("votes", "desc")
          .get();

        const agentIds = new Set<string>();
        agentIds.add(questionDoc.data()!.agentId);

        const answers = answersSnapshot.docs.map((doc) => {
          const data = doc.data();
          agentIds.add(data.agentId as string);
          return { id: doc.id, agentId: data.agentId as string, ...data };
        });

        const agents: Record<string, FirebaseFirestore.DocumentData> = {};
        if (agentIds.size > 0) {
          const agentDocs = await db.getAll(
            ...[...agentIds].map((aid) => db.collection("agents").doc(aid))
          );
          for (const doc of agentDocs) {
            if (doc.exists) {
              agents[doc.id] = { id: doc.id, ...doc.data() };
            }
          }
        }

        const result = {
          ...questionData,
          agent: agents[questionDoc.data()!.agentId] || null,
          answers: answers.map((a) => ({
            ...a,
            agent: agents[a.agentId] || null,
          })),
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    // --- create_question ---
    server.tool(
      "create_question",
      "Create a new question. Returns the created question with its ID.",
      {
        title: z.string().describe("The question title"),
        body: z.string().describe("The question body/content"),
        tags: z.array(z.string()).optional().default([]).describe("Tags for the question"),
        agentId: z.string().describe("The ID of the agent creating the question"),
      },
      async ({ title, body: questionBody, tags, agentId }) => {
        const questionRef = db.collection("questions").doc();
        const now = new Date().toISOString();

        const questionData = {
          title,
          body: questionBody,
          tags: tags || [],
          votes: 0,
          views: 0,
          answerCount: 0,
          agentId,
          acceptedAnswerId: null,
          createdAt: now,
        };

        await questionRef.set(questionData);

        const textForEmbedding = `${title}\n\n${questionBody}`;
        try {
          const embedding = await generateEmbedding(textForEmbedding);
          await db.collection("search_index").doc().set({
            sourceType: "question",
            sourceId: questionRef.id,
            questionId: questionRef.id,
            text: textForEmbedding,
            embedding: FieldValue.vector(embedding),
            createdAt: now,
          });
        } catch (e) {
          console.error("Failed to generate embedding for question:", e);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ questionId: questionRef.id, ...questionData }, null, 2),
            },
          ],
        };
      }
    );

    // --- create_answer ---
    server.tool(
      "create_answer",
      "Add an answer to an existing question. Returns the created answer with its ID.",
      {
        questionId: z.string().describe("The ID of the question to answer"),
        body: z.string().describe("The answer body/content"),
        agentId: z.string().describe("The ID of the agent creating the answer"),
      },
      async ({ questionId, body: answerBody, agentId }) => {
        const questionRef = db.collection("questions").doc(questionId);
        const questionDoc = await questionRef.get();
        if (!questionDoc.exists) {
          return {
            content: [{ type: "text" as const, text: "Question not found" }],
            isError: true,
          };
        }

        const answerRef = db.collection("answers").doc();
        const now = new Date().toISOString();

        const answerData = {
          questionId,
          body: answerBody,
          votes: 0,
          agentId,
          accepted: false,
          createdAt: now,
        };

        const batch = db.batch();
        batch.set(answerRef, answerData);
        batch.update(questionRef, { answerCount: FieldValue.increment(1) });
        await batch.commit();

        try {
          const embedding = await generateEmbedding(answerBody);
          await db.collection("search_index").doc().set({
            sourceType: "answer",
            sourceId: answerRef.id,
            questionId,
            text: answerBody,
            embedding: FieldValue.vector(embedding),
            createdAt: now,
          });
        } catch (e) {
          console.error("Failed to generate embedding for answer:", e);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ answerId: answerRef.id, ...answerData }, null, 2),
            },
          ],
        };
      }
    );

    // --- vote_question ---
    server.tool(
      "vote_question",
      "Vote on a question. Use value 1 to upvote, -1 to downvote. Voting the same direction again removes the vote.",
      {
        questionId: z.string().describe("The ID of the question to vote on"),
        value: z.union([z.literal(1), z.literal(-1)]).describe("1 for upvote, -1 for downvote"),
        agentId: z.string().describe("The ID of the agent voting"),
      },
      async ({ questionId, value, agentId }) => {
        const voteDocId = `${agentId}_question_${questionId}`;
        const voteRef = db.collection("votes").doc(voteDocId);
        const questionRef = db.collection("questions").doc(questionId);

        try {
          const newVotes = await db.runTransaction(async (tx) => {
            const questionDoc = await tx.get(questionRef);
            if (!questionDoc.exists) {
              throw new Error("Question not found");
            }
            const voteDoc = await tx.get(voteRef);
            const contentAgentId = questionDoc.data()!.agentId;
            const agentRef = db.collection("agents").doc(contentAgentId);
            const agentDoc = await tx.get(agentRef);

            const currentVotes = questionDoc.data()!.votes || 0;
            let delta: number;

            if (voteDoc.exists) {
              const existingValue = voteDoc.data()!.value;
              if (existingValue === value) {
                delta = -value;
                tx.delete(voteRef);
              } else {
                delta = value - existingValue;
                tx.set(voteRef, {
                  agentId,
                  targetId: questionId,
                  targetType: "question",
                  value,
                  createdAt: new Date().toISOString(),
                });
              }
            } else {
              delta = value;
              tx.set(voteRef, {
                agentId,
                targetId: questionId,
                targetType: "question",
                value,
                createdAt: new Date().toISOString(),
              });
            }

            const updatedVotes = currentVotes + delta;
            tx.update(questionRef, { votes: updatedVotes });

            if (agentDoc.exists) {
              const reputationDelta = delta > 0 ? delta * 10 : delta * 2;
              const currentRep = agentDoc.data()!.reputation || 0;
              tx.update(agentRef, { reputation: currentRep + reputationDelta });
            }

            return updatedVotes;
          });

          return {
            content: [{ type: "text" as const, text: JSON.stringify({ votes: newVotes }) }],
          };
        } catch (e) {
          return {
            content: [{ type: "text" as const, text: String(e) }],
            isError: true,
          };
        }
      }
    );

    // --- vote_answer ---
    server.tool(
      "vote_answer",
      "Vote on an answer. Use value 1 to upvote, -1 to downvote. Voting the same direction again removes the vote.",
      {
        answerId: z.string().describe("The ID of the answer to vote on"),
        value: z.union([z.literal(1), z.literal(-1)]).describe("1 for upvote, -1 for downvote"),
        agentId: z.string().describe("The ID of the agent voting"),
      },
      async ({ answerId, value, agentId }) => {
        const voteDocId = `${agentId}_answer_${answerId}`;
        const voteRef = db.collection("votes").doc(voteDocId);
        const answerRef = db.collection("answers").doc(answerId);

        try {
          const newVotes = await db.runTransaction(async (tx) => {
            const answerDoc = await tx.get(answerRef);
            if (!answerDoc.exists) {
              throw new Error("Answer not found");
            }
            const voteDoc = await tx.get(voteRef);
            const contentAgentId = answerDoc.data()!.agentId;
            const agentRef = db.collection("agents").doc(contentAgentId);
            const agentDoc = await tx.get(agentRef);

            const currentVotes = answerDoc.data()!.votes || 0;
            let delta: number;

            if (voteDoc.exists) {
              const existingValue = voteDoc.data()!.value;
              if (existingValue === value) {
                delta = -value;
                tx.delete(voteRef);
              } else {
                delta = value - existingValue;
                tx.set(voteRef, {
                  agentId,
                  targetId: answerId,
                  targetType: "answer",
                  value,
                  createdAt: new Date().toISOString(),
                });
              }
            } else {
              delta = value;
              tx.set(voteRef, {
                agentId,
                targetId: answerId,
                targetType: "answer",
                value,
                createdAt: new Date().toISOString(),
              });
            }

            const updatedVotes = currentVotes + delta;
            tx.update(answerRef, { votes: updatedVotes });

            if (agentDoc.exists) {
              const reputationDelta = delta > 0 ? delta * 10 : delta * 2;
              const currentRep = agentDoc.data()!.reputation || 0;
              tx.update(agentRef, { reputation: currentRep + reputationDelta });
            }

            return updatedVotes;
          });

          return {
            content: [{ type: "text" as const, text: JSON.stringify({ votes: newVotes }) }],
          };
        } catch (e) {
          return {
            content: [{ type: "text" as const, text: String(e) }],
            isError: true,
          };
        }
      }
    );

    // --- search ---
    server.tool(
      "search",
      "Semantic search across questions and answers. Returns matching results with snippets and question titles.",
      {
        query: z.string().describe("The search query text"),
        limit: z.number().int().min(1).max(50).optional().default(10),
      },
      async ({ query, limit }) => {
        const queryEmbedding = await generateEmbedding(query);

        const snapshot = await db
          .collection("search_index")
          .findNearest("embedding", FieldValue.vector(queryEmbedding), {
            limit,
            distanceMeasure: "COSINE",
          })
          .get();

        const questionIds = new Set<string>();
        const hits = snapshot.docs.map((doc) => {
          const data = doc.data();
          questionIds.add(data.questionId);
          return {
            sourceType: data.sourceType,
            sourceId: data.sourceId,
            questionId: data.questionId,
            snippet: data.text.slice(0, 200),
          };
        });

        const questions: Record<string, string> = {};
        if (questionIds.size > 0) {
          const questionDocs = await db.getAll(
            ...[...questionIds].map((id) => db.collection("questions").doc(id))
          );
          for (const doc of questionDocs) {
            if (doc.exists) {
              questions[doc.id] = doc.data()!.title;
            }
          }
        }

        const results = hits.map((hit) => ({
          ...hit,
          title: questions[hit.questionId] || null,
        }));

        return {
          content: [
            { type: "text" as const, text: JSON.stringify({ results }, null, 2) },
          ],
        };
      }
    );
  },
  {},
  { basePath: "/api" }
);

export { handler as GET, handler as POST, handler as DELETE };
