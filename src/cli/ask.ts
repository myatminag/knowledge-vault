import { askQuestion } from "@/core/ask-question";

const args = process.argv.slice(2);

try {
  const options: { domain?: string; topic?: string } = {};
  const questionParts: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--domain" || arg === "--topic") {
      const value = args[index + 1];

      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }

      if (arg === "--domain") options.domain = value;
      if (arg === "--topic") options.topic = value;
      index += 1;
      continue;
    }

    questionParts.push(arg);
  }

  const question = questionParts.join(" ");

  const result = await askQuestion(question, options);

  console.log("Answer:");
  console.log(result.answer);
  console.log("\nSources:");

  for (const source of result.sources) {
    console.log(`- ${source}`);
  }
} catch (error) {
  console.error(
    "Error:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
}
