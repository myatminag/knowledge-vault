import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { config } from "@/config/config";
import { callStructured } from "@/llm/structured";
import { KnowledgeSchema } from "../schema/knowledge-schema";
import { resolveTopicDomainPath } from "@/storage/topic-path";
import { renderTopicMarkdown } from "@/render/topic-markdown";
import { scanRawSources, type RawSource } from "@/ingest/raw-source";
import { regenerateWikiIndex } from "@/storage/wiki-index";
import { appendWikiLogEntry } from "@/storage/wiki-log";

const groupByTopicDomain = (raws: RawSource[]) => {
  const groups = new Map<string, RawSource[]>();

  for (const raw of raws) {
    const key = `${raw.meta.domain}|||${raw.meta.topic}`;
    groups.set(key, [...(groups.get(key) ?? []), raw]);
  }

  return groups;
};

const buildPrompt = (raws: RawSource[]) => {
  return raws
    .map((raw, index) => {
      return [
        `Source ${index + 1}: ${raw.meta.title}`,
        raw.meta.source_url ? `URL: ${raw.meta.source_url}` : null,
        raw.body,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");
};

const buildUpdatePrompt = (options: {
  existingMarkdown: string;
  raws: RawSource[];
}) => {
  return [
    "Existing compiled wiki page:",
    options.existingMarkdown,
    "",
    "Raw source material:",
    buildPrompt(options.raws),
  ].join("\n\n---\n\n");
};

const createSystemPrompt = () => `
        You compile raw learning material into a detailed Markdown wiki topic.

        Rules:
        - Do not invent facts.
        - Write a substantial summary of 150-250 words.
        - Produce 6-10 key concepts.
        - Produce 4-6 deep-dive sections.
        - Each deep-dive section should be 120-250 words.
        - Deep-dive section bodies may contain valid Markdown.
        - Use fenced code blocks for code examples.
        - Use bullet lists when explaining multiple items.
        - Preserve important technical terms, formulas, and examples.
        - Prefer useful explanation over brevity.
        - Do not write Markdown headings inside deep-dive bodies; headings are provided separately.
      `;

const updateSystemPrompt = () => `
        You update an existing Markdown wiki topic using raw learning material.

        Rules:
        - Treat raw sources as the source of truth.
        - Treat the existing wiki page as prior synthesis.
        - Preserve useful existing synthesis when it is still supported by the raw sources.
        - Incorporate new source material.
        - Flag unresolved gaps in open questions.
        - Do not invent facts.
        - Write a substantial summary of 150-250 words.
        - Produce 6-10 key concepts.
        - Produce 4-6 deep-dive sections.
        - Each deep-dive section should be 120-250 words.
        - Deep-dive section bodies may contain valid Markdown.
        - Use fenced code blocks for code examples.
        - Use bullet lists when explaining multiple items.
        - Do not write Markdown headings inside deep-dive bodies; headings are provided separately.
      `;

const normalizeStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

const sourceTitleFromRelativePath = (relativePath: string) => {
  return (
    relativePath
      .split("/")
      .at(-1)
      ?.replace(/\.md$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) ?? relativePath
  );
};

export const compileTopic = async (options: {
  domain?: string;
  topic?: string;
} = {}) => {
  const rawDir = path.join(config.vault.path, "00-raw");

  const raws = scanRawSources(rawDir).filter((raw) => {
    if (options.domain && raw.meta.domain !== options.domain) return false;
    if (options.topic && raw.meta.topic !== options.topic) return false;
    return true;
  });

  const groups = groupByTopicDomain(raws);
  const compiledPaths: string[] = [];

  for (const [, group] of [...groups.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const first = group[0];

    if (!first) continue;

    const outputPath = resolveTopicDomainPath({
      vaultPath: config.vault.path,
      domain: first.meta.domain,
      topic: first.meta.topic,
    });
    const existingMarkdown = fs.existsSync(outputPath)
      ? fs.readFileSync(outputPath, "utf-8")
      : undefined;
    const existing = existingMarkdown ? matter(existingMarkdown) : undefined;
    const existingTags = normalizeStringArray(existing?.data.tags);
    const existingSourcePaths = normalizeStringArray(existing?.data.source_paths);
    const rawSources = group.map((raw) => ({
      title: raw.meta.title,
      path: raw.path,
      relativePath: path.relative(config.vault.path, raw.path),
    }));
    const sourceMap = new Map(
      existingSourcePaths.map((relativePath) => [
        relativePath,
        {
          title: sourceTitleFromRelativePath(relativePath),
          path: path.join(config.vault.path, relativePath),
          relativePath,
        },
      ]),
    );

    for (const source of rawSources) {
      sourceMap.set(source.relativePath, source);
    }

    const knowledge = await callStructured({
      schema: KnowledgeSchema,
      name: "compiled_topic",
      system: existingMarkdown ? updateSystemPrompt() : createSystemPrompt(),
      user: existingMarkdown
        ? buildUpdatePrompt({ existingMarkdown, raws: group })
        : buildPrompt(group),
    });

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    fs.writeFileSync(
      outputPath,
      renderTopicMarkdown({
        knowledge,
        domain: first.meta.domain,
        topic: first.meta.topic,
        tags: [
          ...new Set([
            ...existingTags,
            ...group.flatMap((raw) => raw.meta.tags),
          ]),
        ],
        createdAt:
          typeof existing?.data.created_at === "string"
            ? existing.data.created_at
            : undefined,
        sources: [...sourceMap.values()],
      }),
    );

    console.log(`Compiled: ${outputPath}`);

    compiledPaths.push(outputPath);
    appendWikiLogEntry({
      vaultPath: config.vault.path,
      action: existingMarkdown ? "updated" : "created",
      domain: first.meta.domain,
      topic: first.meta.topic,
      outputRelativePath: path.relative(config.vault.path, outputPath),
      rawSourceCount: group.length,
    });
  }

  if (compiledPaths.length > 0) {
    regenerateWikiIndex({ vaultPath: config.vault.path });
  }

  return { compiledPaths };
};
