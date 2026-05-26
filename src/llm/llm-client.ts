import OpenAI from "openai";

import { config } from "@/config/config";

export const llmClient = new OpenAI({
  apiKey: config.openai.apiKey,
  baseURL: config.openai.baseUrl,
});
