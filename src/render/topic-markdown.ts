import matter from "gray-matter";

import { type Knowledge } from "@/core/knowledge-schema";

export const renderTopicMarkdown = (options: {
  knowledge: Knowledge;
  domain: string;
  topic: string;
  tags: string[];
  sourcePaths: string[];
}) => {
  const now = new Date().toISOString();

  const body = [
    `# ${options.knowledge.title}`,
    "",
    "## Summary",
    "",
    options.knowledge.summary,
    "",
    "## Key Concepts",
    ...options.knowledge.keyConcepts.map(
      (concept) => `- **${concept.name}**: ${concept.explanation}`,
    ),
    "",
    "## Deep Dive",
    ...options.knowledge.deepDive.flatMap((section) => [
      `### ${section.heading}`,
      section.body,
      "",
    ]),
    "## Related",
    ...options.knowledge.related.map((item) => `- [[${item}]]`),
    "",
    "## Open Questions",
    ...options.knowledge.openQuestions.map((item) => `- ${item}`),
    "",
    "## Sources",
    ...options.sourcePaths.map((sourcePath) => `- ${sourcePath}`),
    "",
  ].join("\n");

  return matter.stringify(body, {
    title: options.knowledge.title,
    domain: options.domain,
    topic: options.topic,
    tags: options.tags,
    source_type: "topic",
    created_at: now,
    updated_at: now,
  });
};
