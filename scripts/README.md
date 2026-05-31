# Scripts

Local development and maintenance scripts belong here. These files are imported by CLI and core flows; they are not standalone shell scripts.

## Files

- `create-raw-seed.ts` writes a classified user question into `00-raw`.
- `seed-topic.ts` classifies a question and creates the raw seed file.

## `createRawSeed(options)`

**Defined in:** `create-raw-seed.ts`

**Purpose:** Writes a question into the vault as a raw Markdown seed.

**Inputs:** `question`, `classification`, and optional `onExisting`. `onExisting` may be `"error"` or `"reuse"`.

**Output:** `{ path, relativePath, created }`.

**How it works:** Ensures `<vault>/00-raw` exists, slugifies the classified topic, builds `<slug>.md`, handles duplicates based on `onExisting`, writes frontmatter with title, domain, topic, tags, and `source_type: "question"`, and returns path metadata.

**Interactions:** Uses `config.vault.path`, `slugifyTopic`, and the `TopicClassification` type. Called by `seedTopic`.

**Errors/edge cases:** If the target file exists and `onExisting` is not `"reuse"`, throws `Raw seed already exists: <path>`. If `onExisting` is `"reuse"`, returns the existing path with `created: false`.

## `seedTopic(question, options)`

**Defined in:** `seed-topic.ts`

**Purpose:** Classifies a user question and creates a matching raw seed note.

**Inputs:** Question string and optional `{ onExisting?: "error" | "reuse" }`.

**Output:** `{ classification, rawSeed }`.

**How it works:** Calls `classifyTopic(question)`, then passes the classification and duplicate-handling option to `createRawSeed`.

**Interactions:** Called by `src/cli/seed.ts`, the yargs `seed` command, and `askQuestionWithAutoCompile`.

**Errors/edge cases:** Blank question validation happens inside `classifyTopic`. Duplicate handling happens inside `createRawSeed`. LLM and filesystem errors propagate.

## Interaction Notes

- These scripts sit between user-facing commands and core/storage helpers.
- `askQuestionWithAutoCompile` uses `seedTopic(question, { onExisting: "reuse" })` so repeated questions can reuse an existing raw seed.
- The plain seed CLI uses the default duplicate behavior, so it errors when the seed already exists.
