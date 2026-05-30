import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface CompiledTopic {
  path: string;
  relativePath: string;
  title: string;
  domain?: string;
  topic?: string;
  tags: string[];
  sourceCount: number;
  sourcePaths: string[];
  createdAt?: string;
  updatedAt?: string;
  body: string;
}

const walkMarkdownFiles = (dir: string) => {
  if (!fs.existsSync(dir)) return [];

  const result: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push(...walkMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      result.push(fullPath);
    }
  }

  return result;
};

export const readCompiledTopics = (options: {
  vaultPath: string;
  domain?: string;
  topic?: string;
}): CompiledTopic[] => {
  const topicsDir = path.join(options.vaultPath, "04-topics");
  const files = walkMarkdownFiles(topicsDir).filter((filePath) => {
    const relativePath = path.relative(topicsDir, filePath);
    return relativePath !== "index.md" && relativePath !== "log.md";
  });

  return files
    .map((filePath) => {
      const parsed = matter(fs.readFileSync(filePath, "utf-8"));

      return {
        path: filePath,
        relativePath: path.relative(options.vaultPath, filePath),
        title: String(parsed.data.title ?? path.basename(filePath, ".md")),
        domain:
          typeof parsed.data.domain === "string"
            ? parsed.data.domain
            : undefined,
        topic:
          typeof parsed.data.topic === "string" ? parsed.data.topic : undefined,
        tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : [],
        sourceCount:
          typeof parsed.data.source_count === "number"
            ? parsed.data.source_count
            : 0,
        sourcePaths: Array.isArray(parsed.data.source_paths)
          ? parsed.data.source_paths.filter(
              (sourcePath): sourcePath is string =>
                typeof sourcePath === "string",
            )
          : [],
        createdAt:
          typeof parsed.data.created_at === "string"
            ? parsed.data.created_at
            : undefined,
        updatedAt:
          typeof parsed.data.updated_at === "string"
            ? parsed.data.updated_at
            : undefined,
        body: parsed.content.trim(),
      };
    })
    .filter((topic) => {
      if (options.domain && topic.domain !== options.domain) return false;
      if (options.topic && topic.topic !== options.topic) return false;
      return true;
    });
};
