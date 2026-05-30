import { compileTopic } from "@/core/compile-topic";

const args = process.argv.slice(2);
const getOptionValue = (name: string) => {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return undefined;

  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`--${name} requires a value`);
  }

  return value;
};

try {
  const result = await compileTopic({
    domain: getOptionValue("domain"),
    topic: getOptionValue("topic"),
  });

  if (result.compiledPaths.length === 0) {
    console.log("No matching raw sources found.");
  }
} catch (error) {
  console.error(
    "Error:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
}
