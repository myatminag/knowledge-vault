import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import matter from "gray-matter";
import { describe, expect, test } from "bun:test";

import { regenerateWikiIndex } from "@/storage/wiki-index";

const makeTempVault = () => fs.mkdtempSync(path.join(os.tmpdir(), "kc-index-"));

describe("regenerateWikiIndex", () => {
  test("writes an index grouped by domain from compiled topic files", () => {
    const vaultPath = makeTempVault();
    const systemDesignDir = path.join(vaultPath, "04-topics", "System Design");
    const databaseDir = path.join(vaultPath, "04-topics", "Database");
    fs.mkdirSync(systemDesignDir, { recursive: true });
    fs.mkdirSync(databaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(systemDesignDir, "consistent-hashing.md"),
      matter.stringify("# Consistent Hashing", {
        title: "Consistent Hashing",
        domain: "System Design",
        topic: "Consistent Hashing",
        tags: ["distributed-systems"],
        source_count: 2,
      }),
    );
    fs.writeFileSync(
      path.join(databaseDir, "indexes.md"),
      matter.stringify("# Indexes", {
        title: "Indexes",
        domain: "Database",
        topic: "Indexes",
        tags: ["query-planning"],
        source_count: 1,
      }),
    );

    const indexPath = regenerateWikiIndex({ vaultPath });

    expect(indexPath).toBe(path.join(vaultPath, "04-topics", "index.md"));
    expect(fs.readFileSync(indexPath, "utf-8")).toBe(
      [
        "# Knowledge Index",
        "",
        "## Database",
        "",
        "- [[Database/indexes|Indexes]] - topic: Indexes; tags: query-planning; sources: 1",
        "",
        "## System Design",
        "",
        "- [[System Design/consistent-hashing|Consistent Hashing]] - topic: Consistent Hashing; tags: distributed-systems; sources: 2",
        "",
      ].join("\n"),
    );
  });
});
