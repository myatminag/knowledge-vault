import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import { appendWikiLogEntry } from "@/storage/wiki-log";

const makeTempVault = () => fs.mkdtempSync(path.join(os.tmpdir(), "kc-log-"));

describe("appendWikiLogEntry", () => {
  test("appends compile events without rewriting existing log entries", () => {
    const vaultPath = makeTempVault();

    const logPath = appendWikiLogEntry({
      vaultPath,
      action: "created",
      domain: "System Design",
      topic: "Consistent Hashing",
      outputRelativePath: "04-topics/System Design/consistent-hashing.md",
      rawSourceCount: 1,
    });

    appendWikiLogEntry({
      vaultPath,
      action: "updated",
      domain: "System Design",
      topic: "Consistent Hashing",
      outputRelativePath: "04-topics/System Design/consistent-hashing.md",
      rawSourceCount: 2,
    });

    const log = fs.readFileSync(logPath, "utf-8");
    expect(log).toContain("# Knowledge Log");
    expect(log).toContain(
      "compile | created | System Design | Consistent Hashing",
    );
    expect(log).toContain(
      "compile | updated | System Design | Consistent Hashing",
    );
    expect(log.indexOf("raw sources: 1")).toBeLessThan(
      log.indexOf("raw sources: 2"),
    );
  });
});
