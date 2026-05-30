import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

import { callStructured } from "./structured";

const TopicSelectionSchema = z.object({
  selectedPaths: z.array(z.string()),
  reason: z.string(),
});

export const selectTopicsFromIndex = async (options: {
  vaultPath: string;
  question: string;
}) => {
  const indexPath = path.join(options.vaultPath, "04-topics", "index.md");

  if (!fs.existsSync(indexPath)) {
    throw new Error("No wiki index found in 04-topics/index.md");
  }

  return callStructured({
    schema: TopicSelectionSchema,
    name: "topic_selection",
    system: `
      Select the compiled wiki topic paths that are relevant to answering the question.

      Rules:
      - Return only paths that appear in the provided index.
      - Prefer a small focused set of topics.
      - Use paths relative to the vault, starting with 04-topics/.
    `,
    user: [
      "Question:",
      options.question,
      "",
      "Wiki index:",
      fs.readFileSync(indexPath, "utf-8"),
    ].join("\n"),
  });
};
