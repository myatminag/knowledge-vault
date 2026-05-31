import matter from "gray-matter";
import { describe, expect, test } from "bun:test";

import { renderTopicMarkdown } from "@/render/topic-markdown";

describe("renderTopicMarkdown", () => {
  test("renders frontmatter and all topic sections", () => {
    const markdown = renderTopicMarkdown({
      knowledge: {
        title: "Consistent Hashing",
        summary: "A stable partitioning strategy for distributed systems.",
        keyConcepts: [
          {
            name: "Hash Ring",
            explanation: "Maps keys and nodes into one circular space.",
          },
        ],
        deepDive: [
          {
            heading: "Why It Matters",
            body: "It limits key movement when nodes are added or removed.",
          },
        ],
        related: ["Replication"],
        openQuestions: ["How many virtual nodes are enough?"],
      },
      domain: "System Design",
      topic: "Consistent Hashing",
      tags: ["distributed-systems"],
      sources: [
        {
          title: "Consistent Hashing Notes",
          path: "/vault/00-raw/consistent-hashing.md",
          relativePath: "00-raw/consistent-hashing.md",
        },
      ],
    });

    const parsed = matter(markdown);

    expect(parsed.data).toMatchObject({
      title: "Consistent Hashing",
      domain: "System Design",
      topic: "Consistent Hashing",
      tags: ["distributed-systems"],
      source_type: "topic",
    });
    expect(parsed.content).toContain("# Consistent Hashing");
    expect(parsed.content).toContain("## Summary");
    expect(parsed.content).toContain(
      "A stable partitioning strategy for distributed systems.",
    );
    expect(parsed.content).toContain(
      "- **Hash Ring**: Maps keys and nodes into one circular space.",
    );
    expect(parsed.content).toContain("### Why It Matters");
    expect(parsed.content).toContain("- [[Replication]]");
    expect(parsed.content).toContain("- How many virtual nodes are enough?");
    expect(parsed.content).toContain(
      "- [[consistent-hashing|Consistent Hashing Notes]]",
    );
  });
});
