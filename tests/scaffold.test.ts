import { expect, test } from "bun:test";
import { existsSync } from "node:fs";

const expectedDirectories = [
  "src/cli",
  "src/config",
  "src/core",
  "src/ingest",
  "src/llm",
  "src/pipeline",
  "src/render",
  "src/shared",
  "src/storage",
  "tests/unit",
  "tests/integration",
  "tests/fixtures",
  "scripts",
  "docs/decisions",
  "docs/plans",
  "docs/reference",
];

test("project scaffold directories exist", () => {
  for (const directory of expectedDirectories) {
    expect(existsSync(directory)).toBe(true);
  }
});
