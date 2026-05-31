import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import matter from "gray-matter";
import { beforeEach, describe, expect, mock, test } from "bun:test";

process.env.OPENAI_API_KEY = "test-api-key";
const vaultPath = fs.mkdtempSync(path.join(os.tmpdir(), "kc-compile-"));
process.env.KNOWLEDGE_VAULT_PATH = vaultPath;

const callStructured = mock(async ({ user }: { user: string }) => {
  const title = user.includes("Indexes") ? "Indexes" : "Consistent Hashing";

  return {
    title,
    summary: `Summary for ${title}.`,
    keyConcepts: [{ name: "Concept", explanation: "Explanation." }],
    deepDive: [{ heading: "Details", body: "Detailed body." }],
    related: [],
    openQuestions: [],
  };
});

mock.module("@/llm/structured", () => ({
  callStructured,
}));

const writeRaw = (
  vaultPath: string,
  filename: string,
  frontmatter: Record<string, unknown>,
  body: string,
) => {
  const rawDir = path.join(vaultPath, "00-raw");
  fs.mkdirSync(rawDir, { recursive: true });
  fs.writeFileSync(
    path.join(rawDir, filename),
    matter.stringify(body, frontmatter),
  );
};

const readTopicFrontmatter = (relativePath: string) => {
  return matter(
    fs.readFileSync(path.join(vaultPath, relativePath), "utf-8"),
  ).data;
};

describe("compileTopic", () => {
  beforeEach(() => {
    callStructured.mockClear();
    fs.rmSync(path.join(vaultPath, "00-raw"), {
      recursive: true,
      force: true,
    });
    fs.rmSync(path.join(vaultPath, "04-topics"), {
      recursive: true,
      force: true,
    });
  });

  test("compiles every matching topic group and returns all compiled paths", async () => {
    writeRaw(
      vaultPath,
      "consistent-hashing.md",
      {
        title: "Consistent Hashing Notes",
        domain: "System Design",
        topic: "Consistent Hashing",
        tags: ["distributed-systems"],
        source_type: "note",
      },
      "Consistent hashing body.",
    );
    writeRaw(
      vaultPath,
      "indexes.md",
      {
        title: "Indexes Notes",
        domain: "Database",
        topic: "Indexes",
        tags: ["query-planning"],
        source_type: "note",
      },
      "Indexes body.",
    );

    const { compileTopic } = await import("@/core/compile-topic");

    const result = await compileTopic();

    expect(result).toEqual({
      compiledPaths: [
        path.join(vaultPath, "04-topics", "Database", "indexes.md"),
        path.join(
          vaultPath,
          "04-topics",
          "System Design",
          "consistent-hashing.md",
        ),
      ],
    });
    expect(callStructured).toHaveBeenCalledTimes(2);
    expect(
      fs.existsSync(
        path.join(
          vaultPath,
          "04-topics",
          "System Design",
          "consistent-hashing.md",
        ),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(vaultPath, "04-topics", "Database", "indexes.md")),
    ).toBe(true);
  });

  test("respects domain and topic filters", async () => {
    writeRaw(
      vaultPath,
      "consistent-hashing.md",
      {
        title: "Consistent Hashing Notes",
        domain: "System Design",
        topic: "Consistent Hashing",
        tags: [],
        source_type: "note",
      },
      "Consistent hashing body.",
    );
    writeRaw(
      vaultPath,
      "indexes.md",
      {
        title: "Indexes Notes",
        domain: "Database",
        topic: "Indexes",
        tags: [],
        source_type: "note",
      },
      "Indexes body.",
    );

    const { compileTopic } = await import("@/core/compile-topic");

    const result = await compileTopic({
      domain: "Database",
      topic: "Indexes",
    });

    expect(result).toEqual({
      compiledPaths: [
        path.join(vaultPath, "04-topics", "Database", "indexes.md"),
      ],
    });
    expect(callStructured).toHaveBeenCalledTimes(1);
  });

  test("returns an empty path list when there are no matching raw sources", async () => {
    const { compileTopic } = await import("@/core/compile-topic");

    await expect(
      compileTopic({ domain: "Missing", topic: "Missing" }),
    ).resolves.toEqual({
      compiledPaths: [],
    });
  });

  test("updates an existing topic with prior wiki content and preserves created_at", async () => {
    const topicPath = path.join(
      vaultPath,
      "04-topics",
      "System Design",
      "consistent-hashing.md",
    );
    fs.mkdirSync(path.dirname(topicPath), { recursive: true });
    fs.writeFileSync(
      topicPath,
      matter.stringify(
        [
          "# Consistent Hashing",
          "",
          "## Summary",
          "",
          "Existing synthesis that should be considered.",
          "",
          "## Sources",
          "",
          "- [[old-source|Old Source]]",
          "",
        ].join("\n"),
        {
          title: "Consistent Hashing",
          domain: "System Design",
          topic: "Consistent Hashing",
          tags: ["distributed-systems", "hashing"],
          source_type: "topic",
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          source_paths: ["00-raw/old-source.md"],
          source_count: 1,
        },
      ),
    );
    writeRaw(
      vaultPath,
      "consistent-hashing.md",
      {
        title: "Consistent Hashing Notes",
        domain: "System Design",
        topic: "Consistent Hashing",
        tags: ["distributed-systems", "rings"],
        source_type: "note",
      },
      "New source body.",
    );

    const { compileTopic } = await import("@/core/compile-topic");
    await compileTopic({
      domain: "System Design",
      topic: "Consistent Hashing",
    });

    const call = callStructured.mock.calls[0]?.[0] as {
      system: string;
      user: string;
    };
    const frontmatter = readTopicFrontmatter(
      path.join("04-topics", "System Design", "consistent-hashing.md"),
    );

    expect(call.system).toContain("update an existing Markdown wiki topic");
    expect(call.user).toContain("Existing compiled wiki page:");
    expect(call.user).toContain("Existing synthesis that should be considered.");
    expect(frontmatter.created_at).toBe("2026-01-01");
    expect(frontmatter.updated_at).not.toBe("2026-01-01");
    expect(frontmatter.tags).toEqual([
      "distributed-systems",
      "hashing",
      "rings",
    ]);
    expect(frontmatter.source_paths).toEqual([
      "00-raw/old-source.md",
      "00-raw/consistent-hashing.md",
    ]);
    expect(frontmatter.source_count).toBe(2);
  });

  test("regenerates index and appends log entries after compile", async () => {
    writeRaw(
      vaultPath,
      "consistent-hashing.md",
      {
        title: "Consistent Hashing Notes",
        domain: "System Design",
        topic: "Consistent Hashing",
        tags: ["distributed-systems"],
        source_type: "note",
      },
      "Consistent hashing body.",
    );

    const { compileTopic } = await import("@/core/compile-topic");
    await compileTopic();

    const indexPath = path.join(vaultPath, "04-topics", "index.md");
    const logPath = path.join(vaultPath, "04-topics", "log.md");
    const index = fs.readFileSync(indexPath, "utf-8");
    const log = fs.readFileSync(logPath, "utf-8");

    expect(index).toContain("# Knowledge Index");
    expect(index).toContain("## System Design");
    expect(index).toContain(
      "- [[System Design/consistent-hashing|Consistent Hashing]]",
    );
    expect(index).toContain("sources: 1");
    expect(log).toContain("# Knowledge Log");
    expect(log).toContain(
      "compile | created | System Design | Consistent Hashing",
    );
    expect(log).toContain("raw sources: 1");

    await compileTopic();

    const updatedLog = fs.readFileSync(logPath, "utf-8");
    expect(updatedLog).toContain(
      "compile | updated | System Design | Consistent Hashing",
    );
    expect(updatedLog.indexOf("compile | created")).toBeLessThan(
      updatedLog.indexOf("compile | updated"),
    );
  });
});
