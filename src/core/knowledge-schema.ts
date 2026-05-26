import { z } from "zod";

export const KnowledgeSchema = z.object({
  title: z.string(),
  summary: z.string(),
  keyConcepts: z.array(
    z.object({
      name: z.string(),
      explanation: z.string(),
    }),
  ),
  deepDive: z.array(
    z.object({
      heading: z.string(),
      body: z.string(),
    }),
  ),
  related: z.array(z.string()),
  openQuestions: z.array(z.string()),
});

export type Knowledge = z.infer<typeof KnowledgeSchema>;
