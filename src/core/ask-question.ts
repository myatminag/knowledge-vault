import { config } from "@/config/config";
import { compileTopic } from "./compile-topic";
import { answerWithContext } from "@/llm/answer";
import { seedTopic } from "../../scripts/seed-topic";
import { readCompiledTopics, type CompiledTopic } from "@/storage/topic-reader";
import { selectTopicsFromIndex } from "@/llm/retrieval";
import { decideAnswerMemory } from "@/llm/answer-memory";
import { writeAnswerMemory } from "@/storage/answer-memory";
import { appendWikiLogEntry } from "@/storage/wiki-log";

const formatTopicForContext = (topic: CompiledTopic) => {
  return [
    `Source: ${topic.relativePath}`,
    `Title: ${topic.title}`,
    topic.domain ? `Domain: ${topic.domain}` : "",
    topic.topic ? `Topic: ${topic.topic}` : "",
    topic.tags.length > 0 ? `Tags: ${topic.tags.join(", ")}` : "",
    "",
    topic.body,
  ]
    .filter(Boolean)
    .join("\n");
};

const selectTopics = async (options: {
  question: string;
  domain?: string;
  topic?: string;
}) => {
  const topics = readCompiledTopics({
    vaultPath: config.vault.path,
    domain: options.domain,
    topic: options.topic,
  });

  if (topics.length === 0) {
    throw new Error("No compiled topics found in 04-topics");
  }

  if (options.domain || options.topic) {
    return topics;
  }

  const byPath = new Map(topics.map((topic) => [topic.relativePath, topic]));
  const selection = await selectTopicsFromIndex({
    vaultPath: config.vault.path,
    question: options.question,
  });
  const selectedTopics: CompiledTopic[] = [];

  for (const selectedPath of selection.selectedPaths) {
    const topic = byPath.get(selectedPath);

    if (topic) {
      selectedTopics.push(topic);
    }
  }

  if (selectedTopics.length === 0) {
    throw new Error("No relevant compiled topics found for question");
  }

  return selectedTopics;
};

const maybeSaveAnswerMemory = async (options: {
  question: string;
  answer: string;
  topics: CompiledTopic[];
}) => {
  const sources = options.topics.map((topic) => topic.relativePath);
  const targetTopic = options.topics[0];
  const decision = await decideAnswerMemory({
    question: options.question,
    answer: options.answer,
    sources: options.topics.map((topic) => ({
      path: topic.relativePath,
      domain: topic.domain,
      topic: topic.topic,
      title: topic.title,
    })),
  });

  if (!decision.shouldSave || decision.confidence !== "high") {
    return {
      memorySaved: false,
      memoryPath: undefined,
    };
  }

  if (!targetTopic?.domain || !targetTopic.topic) {
    return {
      memorySaved: false,
      memoryPath: undefined,
    };
  }

  const memory = writeAnswerMemory({
    vaultPath: config.vault.path,
    question: options.question,
    answer: options.answer,
    title: decision.title,
    domain: targetTopic.domain,
    topic: targetTopic.topic,
    tags: decision.tags,
    summary: decision.summary,
    sourcePaths: sources,
  });

  appendWikiLogEntry({
    vaultPath: config.vault.path,
    event: "memory",
    memoryPath: memory.relativePath,
    domain: targetTopic.domain,
    topic: targetTopic.topic,
  });

  await compileTopic({
    domain: targetTopic.domain,
    topic: targetTopic.topic,
  });

  return {
    memorySaved: true,
    memoryPath: memory.relativePath,
  };
};

export const askQuestion = async (
  question: string,
  options: { domain?: string; topic?: string },
) => {
  const trimmedQuestion = question.trim();

  if (!trimmedQuestion) {
    throw new Error("Question is required");
  }

  const topics = await selectTopics({
    question: trimmedQuestion,
    domain: options.domain,
    topic: options.topic,
  });

  const context = topics.map(formatTopicForContext).join("\n---\n");

  const answer = await answerWithContext({
    question: trimmedQuestion,
    context,
  });
  const sources = topics.map((t) => t.relativePath);
  const memory = await maybeSaveAnswerMemory({
    question: trimmedQuestion,
    answer,
    topics,
  });

  appendWikiLogEntry({
    vaultPath: config.vault.path,
    event: "ask",
    question: trimmedQuestion,
    selectedTopics: sources,
    sources,
    memorySaved: memory.memorySaved,
    memoryPath: memory.memoryPath,
  });

  return {
    answer,
    sources,
    selectedTopics: sources,
    ...memory,
  };
};

export const askQuestionWithAutoCompile = async (question: string) => {
  const seeded = await seedTopic(question, { onExisting: "reuse" });

  const compiled = await compileTopic({
    domain: seeded.classification.domain,
    topic: seeded.classification.topic,
  });

  const answer = await askQuestion(question, {
    domain: seeded.classification.domain,
    topic: seeded.classification.topic,
  });

  return {
    ...answer,
    classification: seeded.classification,
    rawSeed: seeded.rawSeed,
    compiledPaths: compiled?.compiledPaths || [],
  };
};
