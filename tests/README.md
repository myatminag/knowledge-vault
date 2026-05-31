# Test Structure

Tests are grouped by scope. The current test suite is unit-focused and uses Bun's test runner.

## Folders

- `unit/` contains isolated module and workflow tests.

## Test Helpers

### `makeTempDir()`

**Defined in:** `unit/raw-source.test.ts`

**Purpose:** Creates an isolated temporary raw source directory.

**Inputs:** None.

**Output:** Temporary directory path under the OS temp directory.

**How it works:** Calls `fs.mkdtempSync(path.join(os.tmpdir(), "kc-raw-"))`.

**Interactions:** Used by raw source scanner tests.

### `makeTempVault()`

**Defined in:** `unit/topic-reader.test.ts`, `unit/wiki-index.test.ts`, and `unit/wiki-log.test.ts`

**Purpose:** Creates isolated temporary vault roots for storage tests.

**Inputs:** None.

**Output:** Temporary vault path under the OS temp directory.

**How it works:** Calls `fs.mkdtempSync` with a test-specific prefix.

**Interactions:** Used by topic reader, wiki index, and wiki log tests.

### `vaultPath`

**Defined in:** `unit/compile-topic.test.ts` and `unit/ask-question.test.ts`

**Purpose:** Shared temporary vault path for mocked workflow tests.

**Inputs:** None; initialized at module load.

**Output:** Temporary vault path assigned to `process.env.KNOWLEDGE_VAULT_PATH`.

**How it works:** Creates a temp directory and updates environment variables before importing modules that read config.

**Interactions:** Lets core tests isolate filesystem side effects.

### `callStructured` mock

**Defined in:** `unit/compile-topic.test.ts` and `unit/ask-question.test.ts`

**Purpose:** Replaces LLM structured generation with deterministic test output.

**Inputs:** The same call shape used by `callStructured`.

**Output:** Schema-shaped objects for compilation, topic selection, or answer-memory decisions.

**How it works:** Bun's `mock.module` swaps `@/llm/structured` before importing core modules.

**Interactions:** Protects tests from network calls and makes compile/ask behavior deterministic.

### `answerWithContext` mock

**Defined in:** `unit/ask-question.test.ts`

**Purpose:** Replaces answer generation with deterministic text containing the supplied context.

**Inputs:** Question and context.

**Output:** A string beginning with `Answered with context:`.

**How it works:** Bun's `mock.module` swaps `@/llm/answer`.

**Interactions:** Lets ask tests assert exactly which compiled topic content reached the answer step.

### `writeRaw(vaultPath, filename, frontmatter, body)`

**Defined in:** `unit/compile-topic.test.ts`

**Purpose:** Writes a raw Markdown fixture into `00-raw`.

**Inputs:** Vault path, filename, frontmatter object, and body text.

**Output:** No return value; writes a file.

**How it works:** Ensures the raw directory exists and writes `gray-matter` frontmatter plus body.

**Interactions:** Used by compile workflow tests.

### `readTopicFrontmatter(relativePath)`

**Defined in:** `unit/compile-topic.test.ts`

**Purpose:** Reads frontmatter from a compiled topic fixture.

**Inputs:** Vault-relative topic path.

**Output:** Parsed frontmatter data object.

**How it works:** Reads from the shared test vault and parses with `gray-matter`.

**Interactions:** Used to assert preserved `created_at`, merged tags, and source paths.

### `resetVault()`

**Defined in:** `unit/ask-question.test.ts`

**Purpose:** Clears raw and compiled vault directories between ask workflow tests.

**Inputs:** None.

**Output:** No return value; removes directories.

**How it works:** Deletes `00-raw` and `04-topics` recursively with `force: true`.

**Interactions:** Called from `beforeEach`.

### `writeTopic(relativePath, data)`

**Defined in:** `unit/ask-question.test.ts`

**Purpose:** Writes a compiled topic fixture.

**Inputs:** Vault-relative path and metadata/body data.

**Output:** No return value; writes a Markdown file.

**How it works:** Ensures the parent directory exists and writes frontmatter with title, domain, topic, tags, source type, source count, and source paths.

**Interactions:** Used by ask workflow tests to create selectable topics.

### `writeIndex()`

**Defined in:** `unit/ask-question.test.ts`

**Purpose:** Writes a deterministic wiki index fixture.

**Inputs:** None.

**Output:** No return value; writes `04-topics/index.md`.

**How it works:** Writes two System Design topic index entries.

**Interactions:** Used by retrieval-selection tests for `askQuestion`.

## Unit Test Coverage

- `raw-source.test.ts` verifies missing raw directories, valid frontmatter parsing, nested raw source folders, and invalid frontmatter errors.
- `topic-path.test.ts` verifies topic path resolution, domain preservation, and required domain/topic validation.
- `topic-reader.test.ts` verifies recursive compiled topic reads, domain/topic filters, metadata normalization, and exclusion of index/log files.
- `render-topic-markdown.test.ts` verifies frontmatter and all rendered topic sections.
- `wiki-index.test.ts` verifies domain grouping, sorting, Obsidian links, tags, and source counts in `index.md`.
- `wiki-log.test.ts` verifies compile, ask, and memory log append behavior without rewriting existing entries.
- `compile-topic.test.ts` verifies grouping, filters, empty results, update prompts, frontmatter preservation, tag/source merging, index regeneration, and log entries.
- `ask-question.test.ts` verifies index-based topic selection, direct filter behavior, answer memory skip/save paths, metadata drift protection, recompilation after memory save, and clear errors when selected paths do not exist.

## Running Tests

```bash
bun test
```

The tests set `OPENAI_API_KEY` and `KNOWLEDGE_VAULT_PATH` internally where needed, and mocked LLM modules avoid real network calls.
