import fs from "node:fs";
import path from "node:path";

const formatLogDate = (date: Date) => date.toISOString().slice(0, 10);

export const appendWikiLogEntry = (options: {
  vaultPath: string;
  action: "created" | "updated";
  domain: string;
  topic: string;
  outputRelativePath: string;
  rawSourceCount: number;
}) => {
  const topicsDir = path.join(options.vaultPath, "04-topics");
  fs.mkdirSync(topicsDir, { recursive: true });

  const logPath = path.join(topicsDir, "log.md");

  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, "# Knowledge Log\n\n");
  }

  fs.appendFileSync(
    logPath,
    [
      `## [${formatLogDate(new Date())}] compile | ${options.action} | ${options.domain} | ${options.topic}`,
      "",
      `- output: ${options.outputRelativePath}`,
      `- raw sources: ${options.rawSourceCount}`,
      "",
    ].join("\n"),
  );

  return logPath;
};
