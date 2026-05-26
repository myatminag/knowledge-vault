import path from "node:path";

export const slugifyTopic = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const validateNonEmpty = (value: string, label: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${label} is required!`);
  }

  return trimmed;
};

export function resolveTopicDomainPath(options: {
  vaultPath: string;
  domain: string;
  topic: string;
}) {
  const vaultPath = validateNonEmpty(options.vaultPath, "Vault path");
  const domain = validateNonEmpty(options.domain, "Topic domain");
  const topic = validateNonEmpty(options.topic, "Topic");

  const topicSlug = slugifyTopic(topic);

  if (!topicSlug) {
    throw new Error("Topic must contain at least one letter or number");
  }

  return path.join(vaultPath, "04-topics", domain, `${topicSlug}.md`);
}
