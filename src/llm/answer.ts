import { llmClient } from "./llm-client";

export const answerWithContext = async (options: {
  context: string;
  question: string;
}) => {
  const response = await llmClient.responses.parse({
    model: "gpt-5-mini",
    max_output_tokens: 4000,
    reasoning: {
      effort: "minimal",
    },
    input: [
      {
        role: "system",
        content: `
          You answer questions using only the provided compiled knowledge base context.

          Rules:
          - If the context does not contain enough information, say so clearly.
          - Do not invent facts.
          - Prefer concise but useful answers.
          - Mention relevant source titles when useful.
        `,
      },
      {
        role: "user",
        content: `
          Question:
          ${options.question}

          Compiled knowledge base context:
          ${options.context}
        `,
      },
    ],
  });

  return response.output_text;
};
