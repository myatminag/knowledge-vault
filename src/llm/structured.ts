import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod.js";

import { llmClient } from "./llm-client";

export const callStructured = async <TSchema extends z.ZodTypeAny>(options: {
  schema: TSchema;
  name: string;
  system: string;
  user: string;
}) => {
  const response = await llmClient.responses.parse({
    model: "gpt-5-mini",
    max_output_tokens: 6000,
    reasoning: {
      effort: "minimal",
    },
    input: [
      {
        role: "system",
        content: options.system,
      },
      {
        role: "user",
        content: options.user,
      },
    ],
    text: {
      verbosity: "high",
      format: zodTextFormat(options.schema, options.name),
    },
  });

  if (!response.output_parsed) {
    throw new Error("LLM returned no parsed output");
  }

  return response.output_parsed as z.infer<TSchema>;
};
