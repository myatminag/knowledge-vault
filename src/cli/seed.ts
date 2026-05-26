import { seedTopic } from "../../scripts/seed-topic";

const question = process.argv.slice(2).join(" ");

try {
  const result = await seedTopic(question);

  console.log("\nCreated raw seed:\n");
  console.log(`Title: ${result.classification.title}`);
  console.log(`Domain: ${result.classification.domain}`);
  console.log(`Topic: ${result.classification.topic}`);
  console.log(`Tags: ${result.classification.tags.join(", ")}`);
  console.log(`Path: ${result.rawSeed.relativePath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
