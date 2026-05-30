import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import matter from "gray-matter";
import { describe, expect, test } from "bun:test";

import { readCompiledTopics } from "@/storage/topic-reader";

const makeTempVault = () => fs.mkdtempSync(path.join(os.tmpdir(), "kc-vault-"));

describe("readCompiledTopics", () => {
  test("returns compiled topics recursively and applies domain/topic filters", () => {
    const vaultPath = makeTempVault();
    const systemDesignDir = path.join(vaultPath, "04-topics", "System Design");
    const databaseDir = path.join(vaultPath, "04-topics", "Database");

    fs.mkdirSync(systemDesignDir, { recursive: true });
    fs.mkdirSync(databaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(systemDesignDir, "consistent-hashing.md"),
      matter.stringify("# Consistent Hashing\n\nBody", {
        title: "Consistent Hashing",
        domain: "System Design",
        topic: "Consistent Hashing",
        tags: ["distributed-systems"],
      }),
    );
    fs.writeFileSync(
      path.join(databaseDir, "indexes.md"),
      matter.stringify("# Indexes\n\nBody", {
        title: "Indexes",
        domain: "Database",
        topic: "Indexes",
        tags: ["query-planning"],
      }),
    );

    expect(
      readCompiledTopics({
        vaultPath,
        domain: "System Design",
        topic: "Consistent Hashing",
      }),
    ).toEqual([
      {
        path: path.join(systemDesignDir, "consistent-hashing.md"),
        relativePath: path.join(
          "04-topics",
          "System Design",
          "consistent-hashing.md",
        ),
        title: "Consistent Hashing",
        domain: "System Design",
        topic: "Consistent Hashing",
        tags: ["distributed-systems"],
        body: "# Consistent Hashing\n\nBody",
      },
    ]);
  });
});
