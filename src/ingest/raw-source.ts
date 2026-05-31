import fs from "node:fs";
import { z } from "zod";
import path from "node:path";
import matter from "gray-matter";

export const rawSourceSchema = z.object({
  title: z.string().min(1),
  domain: z.string().min(1),
  topic: z.string().min(1),
  tags: z.array(z.string()).default([]),
  source_type: z.string().default("note"),
  source_url: z.string().url().optional(),
});

export type RawSourceMeta = z.infer<typeof rawSourceSchema>;

export interface RawSource {
  path: string;
  meta: RawSourceMeta;
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

  return result.sort();
};

export const scanRawSources = (dir: string) => {
  if (!fs.existsSync(dir)) return [];

  return walkMarkdownFiles(dir)
    .map((filePath) => {
      const parsed = matter(fs.readFileSync(filePath, "utf-8"));
      const result = rawSourceSchema.safeParse(parsed.data);

      if (!result.success) {
        throw new Error(
          `Invalid raw source frontmatter in ${filePath}: ${result.error.message}`,
        );
      }

      return {
        path: filePath,
        meta: result.data,
        body: parsed.content.trim(),
      };
    });
};
