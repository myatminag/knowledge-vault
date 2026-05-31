import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { slugifyTopic } from "./topic-path";

const uniquePath = (dir: string, slug: string) => {
  let candidate = path.join(dir, `${slug}.md`);
  let index = 2;

  while (fs.existsSync(candidate)) {
    candidate = path.join(dir, `${slug}-${index}.md`);
    index += 1;
  }

  return candidate;
};

export const writeAnswerMemory = (options: {
  vaultPath: string;
  question: string;
  answer: string;
  title: string;
  domain: string;
  topic: string;
  tags: string[];
  summary: string;
  sourcePaths: string[];
}) => {
  const answerDir = path.join(options.vaultPath, "00-raw", "answers");
  fs.mkdirSync(answerDir, { recursive: true });

  const slug = slugifyTopic(options.title || options.question);
  const filePath = uniquePath(answerDir, slug || "answer-memory");
  const relativePath = path.relative(options.vaultPath, filePath);
  const body = [
    `Question: ${options.question}`,
    "",
    "Answer:",
    options.answer.trim(),
    "",
    "Reusable summary:",
    options.summary.trim(),
    "",
    "Source topics:",
    ...options.sourcePaths.map((sourcePath) => `- ${sourcePath}`),
    "",
  ].join("\n");

  fs.writeFileSync(
    filePath,
    matter.stringify(body, {
      title: options.title,
      domain: options.domain,
      topic: options.topic,
      tags: options.tags,
      source_type: "answer",
      source_paths: options.sourcePaths,
    }),
  );

  return {
    path: filePath,
    relativePath,
  };
};
