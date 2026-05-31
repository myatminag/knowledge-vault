# LLM

AI provider integrations and structured generation boundaries belong here. Core modules call this folder instead of constructing OpenAI requests directly.

## Files

- `llm-client.ts` creates the configured OpenAI client.
- `structured.ts` calls OpenAI Responses with Zod-backed structured output.
- `answer.ts` answers user questions from compiled topic context.
- `retrieval.ts` selects relevant compiled topic paths from the wiki index.
- `answer-memory.ts` decides whether an answer should be saved back into raw sources.

## `llmClient`

**Defined in:** `llm-client.ts`

**Purpose:** Shared OpenAI client configured from runtime environment.

**Fields:** Uses `config.openai.apiKey` and optional `config.openai.baseUrl`.

**Used by:** `callStructured` and `answerWithContext`.

**Errors/edge cases:** Configuration validation happens before this client is created because importing `config` loads and validates environment variables.

## `callStructured(options)`

**Defined in:** `structured.ts`

**Purpose:** Runs a structured OpenAI Responses request and returns output parsed through a Zod schema.

**Inputs:** `schema`, output `name`, `system` prompt, and `user` prompt.

**Output:** A value typed as `z.infer<TSchema>`.

**How it works:** Calls `llmClient.responses.parse` using `gpt-5-mini`, minimal reasoning effort, high text verbosity, and `zodTextFormat` for schema-constrained output.

**Interactions:** Used by topic classification, topic compilation, retrieval selection, and answer-memory decisions.

**Errors/edge cases:** Throws `LLM returned no parsed output` if OpenAI returns no parsed object. Network, provider, auth, and schema parsing errors propagate.

## `answerWithContext(options)`

**Defined in:** `answer.ts`

**Purpose:** Produces a natural-language answer using only compiled knowledge base context.

**Inputs:** `question` and `context` strings.

**Output:** `response.output_text` from the OpenAI response.

**How it works:** Sends a system prompt that forbids invention and asks the model to be concise but useful. The user prompt includes the question and compiled context.

**Interactions:** Called by `askQuestion` after core selects and formats topics.

**Errors/edge cases:** If context is insufficient, the model is instructed to say so. Provider errors propagate.

## `TopicSelectionSchema`

**Defined in:** `retrieval.ts`

**Purpose:** Describes the structured result for wiki-index topic selection.

**Fields:** `selectedPaths` is an array of vault-relative topic paths. `reason` explains the selection.

**Used by:** `selectTopicsFromIndex`.

## `selectTopicsFromIndex(options)`

**Defined in:** `retrieval.ts`

**Purpose:** Selects relevant compiled topic paths from `04-topics/index.md`.

**Inputs:** `vaultPath` and a user `question`.

**Output:** `{ selectedPaths: string[], reason: string }`.

**How it works:** Reads the wiki index file and asks the structured LLM wrapper to return a small focused set of paths that appear in the index.

**Interactions:** Called by the private `selectTopics` helper in `src/core/ask-question.ts`.

**Errors/edge cases:** Throws `No wiki index found in 04-topics/index.md` if the index file is missing. LLM and filesystem read errors propagate.

## `AnswerMemoryDecisionSchema`

**Defined in:** `answer-memory.ts`

**Purpose:** Describes whether a generated answer should become reusable raw source material.

**Fields:** `shouldSave`, `title`, `domain`, `topic`, `tags`, `summary`, and `confidence`. `confidence` is one of `low`, `medium`, or `high`.

**Used by:** `decideAnswerMemory`.

## `decideAnswerMemory(options)`

**Defined in:** `answer-memory.ts`

**Purpose:** Asks the LLM whether an answer contains durable reusable knowledge worth saving.

**Inputs:** Question, answer text, and selected source topic metadata.

**Output:** A structured answer-memory decision.

**How it works:** Sends the question, answer, and source topic list to `callStructured` with rules that prevent inventing new domain/topic names and require high confidence only for clearly durable answers.

**Interactions:** Called by `maybeSaveAnswerMemory` in `src/core/ask-question.ts`.

**Errors/edge cases:** The decision can decline saving with empty metadata. LLM/schema failures propagate.

## Interaction Notes

- This folder does not read or write the vault except `retrieval.ts`, which reads `04-topics/index.md` to provide retrieval context.
- Core owns when LLM calls happen. LLM modules own how prompts and response parsing happen.
- All structured generation goes through `callStructured`, which centralizes model choice and schema formatting.
