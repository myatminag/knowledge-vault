import "dotenv/config";
import { z } from "zod";
import path from "node:path";
import { homedir } from "node:os";

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_BASE_URL: z.string().url().optional(),
  KNOWLEDGE_VAULT_PATH: z
    .string()
    .default(path.join(homedir(), "knowledge-vault")),
});

function loadConfig() {
  const parsed = EnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    console.error("Invalid environment configuration:", flat.fieldErrors);
    throw new Error("Invalid environment configuration");
  }

  const env = parsed.data;

  return {
    openai: {
      apiKey: env.OPENAI_API_KEY,
      baseUrl: env.OPENAI_BASE_URL,
    },
    vault: {
      path: env.KNOWLEDGE_VAULT_PATH,
    },
  };
}

export const config = loadConfig();

export type Config = typeof config;
