import { z } from "zod";

import { callStructured } from "./structured";

const AnswerMemoryDecisionSchema = z.object({
  shouldSave: z.boolean(),
  title: z.string(),
  domain: z.string(),
  topic: z.string(),
  tags: z.array(z.string()),
  summary: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
});

export const decideAnswerMemory = async (options: {
  question: string;
  answer: string;
  sources: {
    path: string;
    domain?: string;
    topic?: string;
    title: string;
  }[];
}) => {
  return callStructured({
    schema: AnswerMemoryDecisionSchema,
    name: "answer_memory_decision",
    system: `
      Decide whether this answer contains durable reusable knowledge worth saving
      into a local personal wiki.

      Rules:
      - Save only if the answer is reusable beyond this one question.
      - Use high confidence only when the answer is clearly durable and supported by sources.
      - If not saving, return shouldSave false and empty strings/arrays for metadata.
      - Do not invent new domain or topic names.
      - Domain and topic are controlled by the selected source topics.
      - If metadata is needed, prefer the first selected source topic.
    `,
    user: [
      "Question:",
      options.question,
      "",
      "Answer:",
      options.answer,
      "",
      "Selected source topics:",
      ...options.sources.map((source) =>
        [
          `- path: ${source.path}`,
          `  title: ${source.title}`,
          `  domain: ${source.domain ?? ""}`,
          `  topic: ${source.topic ?? ""}`,
        ].join("\n"),
      ),
    ].join("\n"),
  });
};
