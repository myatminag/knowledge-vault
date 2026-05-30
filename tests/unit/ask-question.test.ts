import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import matter from "gray-matter";
import { beforeEach, describe, expect, mock, test } from "bun:test";

process.env.OPENAI_API_KEY = "test-api-key";
const vaultPath = fs.mkdtempSync(path.join(os.tmpdir(), "kc-ask-"));
process.env.KNOWLEDGE_VAULT_PATH = vaultPath;

const answerWithContext = mock(
  async ({ context }: { question: string; context: string }) => {
    return `Answered with context:\n${context}`;
  },
);

const callStructured = mock(
  async ({ name }: { name: string; system: string; user: string }) => {
    if (name === "topic_selection") {
      return {
        selectedPaths: [
          "04-topics/System Design/consistent-hashing.md",
          "04-topics/Missing/missing.md",
        ],
        reason: "Consistent hashing is the relevant wiki topic.",
      };
    }

    if (name === "answer_memory_decision") {
      return {
        shouldSave: true,
        title: "When to use consistent hashing",
        domain: "System Design",
        topic: "Consistent Hashing",
        tags: ["distributed-systems", "answer-memory"],
        summary: "Consistent hashing is useful when membership changes often.",
        confidence: "high",
      };
    }

    return {
      title: "Consistent Hashing",
      summary: "Updated summary.",
      keyConcepts: [{ name: "Ring", explanation: "A hash ring." }],
      deepDive: [{ heading: "Use Cases", body: "Use consistent hashing." }],
      related: [],
      openQuestions: [],
    };
  },
);

mock.module("@/llm/answer", () => ({
  answerWithContext,
}));

mock.module("@/llm/structured", () => ({
  callStructured,
}));

const resetVault = () => {
  fs.rmSync(path.join(vaultPath, "00-raw"), { recursive: true, force: true });
  fs.rmSync(path.join(vaultPath, "04-topics"), { recursive: true, force: true });
};

const writeTopic = (relativePath: string, data: Record<string, unknown>) => {
  const filePath = path.join(vaultPath, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    matter.stringify(`# ${data.title}\n\n${data.body}`, {
      title: data.title,
      domain: data.domain,
      topic: data.topic,
      tags: data.tags,
      source_type: "topic",
      source_count: 1,
      source_paths: [`00-raw/${path.basename(relativePath)}`],
    }),
  );
};

const writeIndex = () => {
  const indexPath = path.join(vaultPath, "04-topics", "index.md");
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(
    indexPath,
    [
      "# Knowledge Index",
      "",
      "## System Design",
      "",
      "- [[System Design/consistent-hashing|Consistent Hashing]] - topic: Consistent Hashing; tags: distributed-systems; sources: 1",
      "- [[System Design/load-balancing|Load Balancing]] - topic: Load Balancing; tags: distributed-systems; sources: 1",
      "",
    ].join("\n"),
  );
};

describe("askQuestion", () => {
  beforeEach(() => {
    resetVault();
    answerWithContext.mockClear();
    callStructured.mockClear();
  });

  test("uses the wiki index to select topic pages before answering", async () => {
    writeIndex();
    writeTopic("04-topics/System Design/consistent-hashing.md", {
      title: "Consistent Hashing",
      domain: "System Design",
      topic: "Consistent Hashing",
      tags: ["distributed-systems"],
      body: "Consistent hashing minimizes remapping.",
    });
    writeTopic("04-topics/System Design/load-balancing.md", {
      title: "Load Balancing",
      domain: "System Design",
      topic: "Load Balancing",
      tags: ["distributed-systems"],
      body: "Load balancing spreads traffic.",
    });

    const { askQuestion } = await import("@/core/ask-question");

    const result = await askQuestion("When should I use consistent hashing?", {});

    expect(result.selectedTopics).toEqual([
      "04-topics/System Design/consistent-hashing.md",
    ]);
    expect(result.sources).toEqual([
      "04-topics/System Design/consistent-hashing.md",
    ]);
    expect(result.memorySaved).toBe(true);
    expect(result.memoryPath).toBe(
      "00-raw/answers/when-to-use-consistent-hashing.md",
    );

    const answerCall = answerWithContext.mock.calls[0]?.[0] as {
      context: string;
    };
    expect(answerCall.context).toContain("Consistent hashing minimizes remapping.");
    expect(answerCall.context).not.toContain("Load balancing spreads traffic.");
  });

  test("keeps domain and topic filters on the direct topic path", async () => {
    writeTopic("04-topics/System Design/consistent-hashing.md", {
      title: "Consistent Hashing",
      domain: "System Design",
      topic: "Consistent Hashing",
      tags: [],
      body: "Filtered topic body.",
    });

    const { askQuestion } = await import("@/core/ask-question");

    const result = await askQuestion("Explain this topic", {
      domain: "System Design",
      topic: "Consistent Hashing",
    });

    expect(result.selectedTopics).toEqual([
      "04-topics/System Design/consistent-hashing.md",
    ]);
    expect(
      callStructured.mock.calls.some(
        ([call]) => (call as { name: string }).name === "topic_selection",
      ),
    ).toBe(false);
  });

  test("does not save answer memory when the LLM declines write-back", async () => {
    callStructured.mockImplementation(
      async ({ name }: { name: string; system: string; user: string }) => {
        if (name === "topic_selection") {
          return {
            selectedPaths: ["04-topics/System Design/consistent-hashing.md"],
            reason: "Relevant.",
          };
        }

        if (name === "answer_memory_decision") {
          return {
            shouldSave: false,
            title: "",
            domain: "",
            topic: "",
            tags: [],
            summary: "",
            confidence: "low",
          };
        }

        throw new Error(`Unexpected structured call: ${name}`);
      },
    );
    writeIndex();
    writeTopic("04-topics/System Design/consistent-hashing.md", {
      title: "Consistent Hashing",
      domain: "System Design",
      topic: "Consistent Hashing",
      tags: [],
      body: "Topic body.",
    });

    const { askQuestion } = await import("@/core/ask-question");

    const result = await askQuestion("Is this reusable?", {});

    expect(result.memorySaved).toBe(false);
    expect(result.memoryPath).toBeUndefined();
    expect(fs.existsSync(path.join(vaultPath, "00-raw", "answers"))).toBe(false);
  });

  test("throws clearly when index selection finds no existing topics", async () => {
    callStructured.mockImplementation(
      async ({ name }: { name: string; system: string; user: string }) => {
        if (name === "topic_selection") {
          return {
            selectedPaths: ["04-topics/Missing/missing.md"],
            reason: "No usable match.",
          };
        }

        throw new Error(`Unexpected structured call: ${name}`);
      },
    );
    writeIndex();
    writeTopic("04-topics/System Design/consistent-hashing.md", {
      title: "Consistent Hashing",
      domain: "System Design",
      topic: "Consistent Hashing",
      tags: [],
      body: "Topic body.",
    });

    const { askQuestion } = await import("@/core/ask-question");

    await expect(askQuestion("Unknown?", {})).rejects.toThrow(
      "No relevant compiled topics found for question",
    );
  });
});
