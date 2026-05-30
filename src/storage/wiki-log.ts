import fs from "node:fs";
import path from "node:path";

const formatLogDate = (date: Date) => date.toISOString().slice(0, 10);

type CompileLogEntry = {
  vaultPath: string;
  event?: "compile";
  action: "created" | "updated";
  domain: string;
  topic: string;
  outputRelativePath: string;
  rawSourceCount: number;
};

type AskLogEntry = {
  vaultPath: string;
  event: "ask";
  question: string;
  selectedTopics: string[];
  sources: string[];
  memorySaved: boolean;
  memoryPath?: string;
};

type MemoryLogEntry = {
  vaultPath: string;
  event: "memory";
  memoryPath: string;
  domain: string;
  topic: string;
};

export const appendWikiLogEntry = (
  options: CompileLogEntry | AskLogEntry | MemoryLogEntry,
) => {
  const topicsDir = path.join(options.vaultPath, "04-topics");
  fs.mkdirSync(topicsDir, { recursive: true });

  const logPath = path.join(topicsDir, "log.md");

  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, "# Knowledge Log\n\n");
  }

  const date = formatLogDate(new Date());

  if (options.event === "ask") {
    fs.appendFileSync(
      logPath,
      [
        `## [${date}] ask | ${options.memorySaved ? "memory saved" : "memory skipped"} | ${options.question}`,
        "",
        `- selected topics: ${options.selectedTopics.join(", ") || "none"}`,
        `- sources: ${options.sources.join(", ") || "none"}`,
        options.memoryPath ? `- memory: ${options.memoryPath}` : "- memory: none",
        "",
      ].join("\n"),
    );
    return logPath;
  }

  if (options.event === "memory") {
    fs.appendFileSync(
      logPath,
      [
        `## [${date}] memory | saved | ${options.domain} | ${options.topic}`,
        "",
        `- path: ${options.memoryPath}`,
        "",
      ].join("\n"),
    );
    return logPath;
  }

  fs.appendFileSync(
    logPath,
    [
      `## [${date}] compile | ${options.action} | ${options.domain} | ${options.topic}`,
      "",
      `- output: ${options.outputRelativePath}`,
      `- raw sources: ${options.rawSourceCount}`,
      "",
    ].join("\n"),
  );

  return logPath;
};
