# Core

Compiler use cases and domain orchestration belong here. This layer coordinates other modules without depending on command-line details.

## Files

- `topic-classification.ts` classifies a user question into raw-source metadata.
- `compile-topic.ts` compiles raw Markdown sources into durable topic pages.
- `ask-question.ts` answers questions against compiled topics and optionally writes reusable answer memory.

## `TopicClassificationSchema`

**Defined in:** `topic-classification.ts`

**Purpose:** Zod schema for metadata returned by the LLM when a question is classified for raw seeding.

**Fields:** `title`, `domain`, and `topic` must be non-empty strings. `tags` must contain one to five non-empty strings.

**Used by:** `classifyTopic`, `TopicClassification`, and `scripts/create-raw-seed.ts`.

## `TopicClassification`

**Defined in:** `topic-classification.ts`

**Purpose:** TypeScript type inferred from `TopicClassificationSchema`.

**Fields:** Matches the schema fields exactly: title, domain, topic, and tags.

**Used by:** `createRawSeed` to write raw seed frontmatter.

## `classifyTopic(question)`

**Defined in:** `topic-classification.ts`

**Purpose:** Converts a user learning question into vault metadata for a raw seed note.

**Inputs:** A question string. The function trims it before use.

**Output:** A structured `TopicClassification` object returned by `callStructured`.

**How it works:** It validates that the trimmed question is not empty, then sends a prompt to the LLM asking for a title, domain, canonical topic, and kebab-case tags.

**Interactions:** Calls `callStructured` from `src/llm/structured.ts` with `TopicClassificationSchema`.

**Errors/edge cases:** Throws `Question is required` for blank input. LLM/schema failures propagate from `callStructured`.

## `groupByTopicDomain(raws)`

**Defined in:** `compile-topic.ts`

**Purpose:** Groups raw source records by `domain` and `topic`.

**Inputs:** An array of `RawSource` records from `scanRawSources`.

**Output:** A `Map<string, RawSource[]>` keyed as `domain|||topic`.

**How it works:** Iterates through raw sources and appends each source into the map bucket for its metadata pair.

**Interactions:** Used only by `compileTopic` to decide how many topic pages to compile.

**Errors/edge cases:** Empty input returns an empty map.

## `buildPrompt(raws)`

**Defined in:** `compile-topic.ts`

**Purpose:** Builds the user prompt for creating a compiled topic from raw source material.

**Inputs:** Raw source records.

**Output:** A string containing numbered sources, optional URLs, and raw bodies separated by `---`.

**How it works:** Maps each raw source into a labeled text block and removes the URL line when no source URL exists.

**Interactions:** Used by `compileTopic` for new topics and by `buildUpdatePrompt` for existing topics.

**Errors/edge cases:** Empty input returns an empty string.

## `buildUpdatePrompt(options)`

**Defined in:** `compile-topic.ts`

**Purpose:** Builds the user prompt for updating an existing compiled topic.

**Inputs:** `existingMarkdown` and raw source records.

**Output:** A prompt string containing the existing wiki page and new raw source material.

**How it works:** Joins the existing page and `buildPrompt(raws)` with separators so the LLM can compare prior synthesis with source truth.

**Interactions:** Used by `compileTopic` when the output topic file already exists.

**Errors/edge cases:** Does not validate Markdown; it forwards the current file contents as text.

## `createSystemPrompt()`

**Defined in:** `compile-topic.ts`

**Purpose:** Returns instructions for creating a new compiled topic.

**Inputs:** None.

**Output:** A system prompt string.

**How it works:** Encodes summary length, key concept count, deep-dive count, Markdown rules, and the requirement not to invent facts.

**Interactions:** Used by `compileTopic` for first-time topic creation.

**Errors/edge cases:** No runtime errors; it returns a static string.

## `updateSystemPrompt()`

**Defined in:** `compile-topic.ts`

**Purpose:** Returns instructions for updating an existing compiled topic.

**Inputs:** None.

**Output:** A system prompt string.

**How it works:** Adds update-specific guidance to preserve supported existing synthesis, incorporate new sources, and flag gaps.

**Interactions:** Used by `compileTopic` when a topic Markdown file already exists.

**Errors/edge cases:** No runtime errors; it returns a static string.

## `normalizeStringArray(value)`

**Defined in:** `compile-topic.ts`

**Purpose:** Safely extracts string arrays from parsed frontmatter values.

**Inputs:** Any unknown value.

**Output:** An array containing only string items, or an empty array.

**How it works:** Checks `Array.isArray`, then filters out non-string entries.

**Interactions:** Used by `compileTopic` to preserve existing tags and source paths.

**Errors/edge cases:** Non-arrays, missing values, and malformed arrays become empty or filtered arrays.

## `sourceTitleFromRelativePath(relativePath)`

**Defined in:** `compile-topic.ts`

**Purpose:** Creates a readable source title from an existing relative source path.

**Inputs:** A vault-relative source path.

**Output:** A title-cased string based on the filename, or the original path as fallback.

**How it works:** Takes the last path segment, removes `.md`, replaces dashes/underscores with spaces, and title-cases word starts.

**Interactions:** Used by `compileTopic` when preserving sources from an existing topic's `source_paths` frontmatter.

**Errors/edge cases:** If the path cannot produce a filename, it returns the original relative path.

## `compileTopic(options)`

**Defined in:** `compile-topic.ts`

**Purpose:** Compiles matching raw sources into Markdown topic pages under `04-topics`.

**Inputs:** Optional `domain` and `topic` filters. Defaults to compiling every raw source group.

**Output:** `{ compiledPaths: string[] }`.

**How it works:** It scans `00-raw`, filters raw sources, groups them by domain/topic, reads any existing compiled page, builds either a create or update prompt, calls the LLM with `KnowledgeSchema`, renders Markdown, writes the topic file, appends a log entry, and regenerates the wiki index if at least one topic was compiled.

**Interactions:** Calls `config`, `scanRawSources`, `callStructured`, `KnowledgeSchema`, `resolveTopicDomainPath`, `renderTopicMarkdown`, `appendWikiLogEntry`, and `regenerateWikiIndex`.

**Errors/edge cases:** Returns an empty compiled path list when no raw sources match. Invalid raw source frontmatter, topic path validation failures, LLM failures, and filesystem write errors propagate.

## `formatTopicForContext(topic)`

**Defined in:** `ask-question.ts`

**Purpose:** Converts a compiled topic record into text suitable for an answer prompt.

**Inputs:** A `CompiledTopic`.

**Output:** A text block containing source path, title, optional domain/topic/tags, and body.

**How it works:** Builds labeled lines and removes empty optional lines before joining.

**Interactions:** Used by `askQuestion` after topic selection.

**Errors/edge cases:** Missing optional metadata is omitted.

## `selectTopics(options)`

**Defined in:** `ask-question.ts`

**Purpose:** Chooses compiled topics to use as answer context.

**Inputs:** Question plus optional `domain` and `topic` filters.

**Output:** An array of `CompiledTopic` records.

**How it works:** Reads compiled topics from storage. If filters are provided, it returns those filtered topics directly. Otherwise it asks the LLM to select paths from the wiki index and keeps only selected paths that exist in the current topic list.

**Interactions:** Calls `readCompiledTopics` and `selectTopicsFromIndex`.

**Errors/edge cases:** Throws `No compiled topics found in 04-topics` when no topics exist. Throws `No relevant compiled topics found for question` when index selection returns no usable existing topic.

## `maybeSaveAnswerMemory(options)`

**Defined in:** `ask-question.ts`

**Purpose:** Decides whether an answer is durable enough to save as raw source material.

**Inputs:** Question, answer text, and selected compiled topics.

**Output:** `{ memorySaved: boolean, memoryPath?: string }`.

**How it works:** Calls the LLM for a memory decision, requires `shouldSave` with high confidence, writes the answer memory under `00-raw/answers`, logs the memory event, and recompiles the selected topic.

**Interactions:** Calls `decideAnswerMemory`, `writeAnswerMemory`, `appendWikiLogEntry`, and `compileTopic`.

**Errors/edge cases:** Skips saving when the decision is negative, confidence is not high, or the selected topic lacks domain/topic metadata. Filesystem, LLM, and compile errors propagate after a save attempt begins.

## `askQuestion(question, options)`

**Defined in:** `ask-question.ts`

**Purpose:** Answers a question using compiled topic context.

**Inputs:** A question string and optional `domain`/`topic` filters.

**Output:** An object containing `answer`, `sources`, `selectedTopics`, `memorySaved`, and optional `memoryPath`.

**How it works:** Trims and validates the question, selects compiled topics, formats them into context, calls the answer LLM, optionally saves answer memory, appends an ask log entry, and returns the answer plus source metadata.

**Interactions:** Calls `selectTopics`, `formatTopicForContext`, `answerWithContext`, `maybeSaveAnswerMemory`, and `appendWikiLogEntry`.

**Errors/edge cases:** Throws `Question is required` for blank input. Topic selection, LLM, memory write, log write, and filesystem errors propagate.

## `askQuestionWithAutoCompile(question)`

**Defined in:** `ask-question.ts`

**Purpose:** Runs the full ask flow from an unclassified question: seed, compile, then answer.

**Inputs:** A question string.

**Output:** The `askQuestion` result plus `classification`, `rawSeed`, and `compiledPaths`.

**How it works:** Calls `seedTopic` with `onExisting: "reuse"`, compiles the classified domain/topic, then answers using direct domain/topic filters.

**Interactions:** Calls `scripts/seed-topic.ts`, `compileTopic`, and `askQuestion`.

**Errors/edge cases:** Propagates question validation, classification, seed creation, compile, and answer errors.
