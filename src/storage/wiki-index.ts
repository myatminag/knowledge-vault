import fs from "node:fs";
import path from "node:path";

import { readCompiledTopics } from "./topic-reader";

const formatTags = (tags: string[]) => {
  if (tags.length === 0) return "none";
  return tags.join(", ");
};

export const regenerateWikiIndex = (options: { vaultPath: string }) => {
  const topicsDir = path.join(options.vaultPath, "04-topics");
  fs.mkdirSync(topicsDir, { recursive: true });

  const topics = readCompiledTopics({ vaultPath: options.vaultPath }).sort(
    (a, b) =>
      `${a.domain ?? ""}/${a.title}`.localeCompare(
        `${b.domain ?? ""}/${b.title}`,
      ),
  );

  const byDomain = new Map<string, typeof topics>();

  for (const topic of topics) {
    const domain = topic.domain ?? "Uncategorized";
    byDomain.set(domain, [...(byDomain.get(domain) ?? []), topic]);
  }

  const lines = ["# Knowledge Index", ""];

  for (const [domain, domainTopics] of [...byDomain.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    lines.push(`## ${domain}`, "");

    for (const topic of domainTopics) {
      const linkPath = topic.relativePath
        .replace(/^04-topics\//, "")
        .replace(/\.md$/, "");
      lines.push(
        `- [[${linkPath}|${topic.title}]] - topic: ${topic.topic ?? topic.title}; tags: ${formatTags(topic.tags)}; sources: ${topic.sourceCount}`,
      );
    }

    lines.push("");
  }

  const indexPath = path.join(topicsDir, "index.md");
  fs.writeFileSync(indexPath, lines.join("\n"));
  return indexPath;
};
