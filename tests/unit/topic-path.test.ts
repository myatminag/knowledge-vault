import { describe, expect, test } from "bun:test";

import { resolveTopicDomainPath } from "@/storage/topic-path";

describe("resolveTopicDomainPath", () => {
  test("resolves a topic inside a readable domain folder", () => {
    expect(
      resolveTopicDomainPath({
        vaultPath: "/vault",
        domain: "System Design",
        topic: "Consistent Hashing",
      }),
    ).toBe("/vault/04-topics/System Design/consistent-hashing.md");
  });

  test("preserves programming language domain names", () => {
    expect(
      resolveTopicDomainPath({
        vaultPath: "/vault",
        domain: "JavaScript",
        topic: "Event Loop",
      }),
    ).toBe("/vault/04-topics/JavaScript/event-loop.md");
  });

  test("requires a domain", () => {
    expect(() =>
      resolveTopicDomainPath({
        vaultPath: "/vault",
        domain: "",
        topic: "Transactions",
      }),
    ).toThrow("Topic domain is required");
  });

  test("requires a topic", () => {
    expect(() =>
      resolveTopicDomainPath({
        vaultPath: "/vault",
        domain: "Database",
        topic: "",
      }),
    ).toThrow("Topic is required");
  });
});
