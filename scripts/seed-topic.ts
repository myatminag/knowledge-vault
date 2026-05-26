import { classifyTopic } from "@/core/topic-classification";

import { createRawSeed } from "./create-raw-seed";

export async function seedTopic(question: string) {
  const classification = await classifyTopic(question);

  const rawSeed = createRawSeed({
    question,
    classification,
  });

  return {
    classification,
    rawSeed,
  };
}
