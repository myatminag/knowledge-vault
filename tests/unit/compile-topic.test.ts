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
  fs.writeFileSync(path.join(rawDir, filename), matter.stringify(body, frontmatter));
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
});
