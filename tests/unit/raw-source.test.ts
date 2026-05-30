import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import { scanRawSources } from "@/ingest/raw-source";

const makeTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "kc-raw-"));

describe("scanRawSources", () => {
  test("returns an empty list when the raw directory does not exist", () => {
    const missingDir = path.join(makeTempDir(), "missing");

    expect(scanRawSources(missingDir)).toEqual([]);
  });

  test("parses Markdown files with valid raw source frontmatter", () => {
    const rawDir = makeTempDir();
    const sourcePath = path.join(rawDir, "consistent-hashing.md");

    fs.writeFileSync(
      sourcePath,
      [
        "---",
        "title: Consistent Hashing",
        "domain: System Design",
        "topic: Consistent Hashing",
        "tags:",
        "  - distributed-systems",
        "source_type: note",
        "source_url: https://example.com/consistent-hashing",
        "---",
        "",
        "Consistent hashing reduces remapping when nodes change.",
      ].join("\n"),
    );

    expect(scanRawSources(rawDir)).toEqual([
      {
        path: sourcePath,
        meta: {
          title: "Consistent Hashing",
          domain: "System Design",
          topic: "Consistent Hashing",
          tags: ["distributed-systems"],
          source_type: "note",
          source_url: "https://example.com/consistent-hashing",
        },
        body: "Consistent hashing reduces remapping when nodes change.",
      },
    ]);
  });

  test("throws a useful error for invalid raw source frontmatter", () => {
    const rawDir = makeTempDir();
    const sourcePath = path.join(rawDir, "invalid.md");

    fs.writeFileSync(
      sourcePath,
      ["---", "title: Missing Domain", "topic: Broken", "---", "", "Body"].join(
        "\n",
      ),
    );

    expect(() => scanRawSources(rawDir)).toThrow(
      `Invalid raw source frontmatter in ${sourcePath}:`,
    );
  });
});
