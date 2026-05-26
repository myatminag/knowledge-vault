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

export const scanRawSources = (dir: string) => {
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const filePath = path.join(dir, file);
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
