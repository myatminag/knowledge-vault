import { askQuestion } from "@/core/ask-question";

const question = process.argv.slice(2).join(" ");

try {
  const result = await askQuestion(question);

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
