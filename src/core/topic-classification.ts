import { z } from "zod";

import { callStructured } from "@/llm/structured";

export const TopicClassificationSchema = z.object({
  title: z.string().min(1),
  domain: z.string().min(1),
  topic: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1).max(5),
});

export type TopicClassification = z.infer<typeof TopicClassificationSchema>;

export const classifyTopic = async (question: string) => {
  const trimmed = question.trim();

  if (!trimmed) {
    throw new Error("Question is required");
  }

  return callStructured({
    schema: TopicClassificationSchema,
    name: "topic_classification",
    system: `
      You classify a user's learning question into metadata for a local Markdown knowledge vault.

      Rules:
      - Do not answer the question.
      - Choose a concise, human-readable domain folder name.
      - Prefer domains like React, JavaScript, Database, Algorithms, System Design, Deep Learning, C, C++.
      - Choose a canonical topic name suitable for a wiki note.
      - Write a readable title for the raw seed note.
      - Return 2-5 lowercase tags.
      - Tags should use kebab-case.
    `.trim(),
    user: `
      Question: ${trimmed}
    `.trim(),
  });
};
