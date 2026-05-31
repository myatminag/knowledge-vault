# Storage

Filesystem, vault, cache, and durable persistence boundaries belong here.

## Files

- `topic-path.ts` validates topic path inputs and resolves compiled topic filenames.
- `topic-reader.ts` reads compiled topic Markdown files from the vault.
- `answer-memory.ts` writes answer memories under `00-raw/answers`.
- `wiki-index.ts` regenerates `04-topics/index.md`.
- `wiki-log.ts` appends compile, ask, and memory events to `04-topics/log.md`.

## `slugifyTopic(value)`

**Defined in:** `topic-path.ts`

**Purpose:** Converts a topic title into a filesystem-friendly Markdown filename stem.

**Inputs:** Any string value.

**Output:** Lowercase slug with ampersands replaced by `and`, non-alphanumerics collapsed to dashes, and leading/trailing dashes removed.

**How it works:** Trims, lowercases, replaces `&`, replaces all non-`a-z0-9` runs with `-`, and trims dashes.

**Interactions:** Used by `resolveTopicDomainPath` and `writeAnswerMemory`.

**Errors/edge cases:** Symbol-only input can produce an empty string; callers decide whether that is valid.

## `validateNonEmpty(value, label)`

**Defined in:** `topic-path.ts`

**Purpose:** Validates required path fields.

**Inputs:** A value and a human-readable label.

**Output:** The trimmed value.

**How it works:** Trims the input and throws if the result is empty.

**Interactions:** Used by `resolveTopicDomainPath`.

**Errors/edge cases:** Throws `${label} is required!` for empty or whitespace-only input.

## `resolveTopicDomainPath(options)`

**Defined in:** `topic-path.ts`

**Purpose:** Resolves where a compiled topic Markdown file should live.

**Inputs:** `vaultPath`, `domain`, and `topic`.

**Output:** Absolute path like `<vault>/04-topics/<domain>/<topic-slug>.md`.

**How it works:** Validates required inputs, slugifies the topic, verifies the slug contains at least one alphanumeric character, and joins the vault path segments.

**Interactions:** Used by `compileTopic` when writing compiled topic pages.

**Errors/edge cases:** Throws when vault path, domain, or topic is empty. Throws `Topic must contain at least one letter or number` for topics that slugify to an empty string.

## `CompiledTopic`

**Defined in:** `topic-reader.ts`

**Purpose:** In-memory representation of a compiled topic Markdown file.

**Fields:** Absolute `path`, vault-relative `relativePath`, title, optional domain/topic, tags, source count, source paths, optional created/updated dates, and body content.

**Used by:** `askQuestion`, `regenerateWikiIndex`, and tests.

## `walkMarkdownFiles(dir)`

**Defined in:** `topic-reader.ts`

**Purpose:** Recursively discovers compiled Markdown files.

**Inputs:** Directory path.

**Output:** Array of Markdown file paths.

**How it works:** Returns empty when the directory does not exist, recursively walks directories, and collects files ending in `.md`.

**Interactions:** Used only by `readCompiledTopics`.

**Errors/edge cases:** Does not sort results in this module. Filesystem read errors propagate.

## `readCompiledTopics(options)`

**Defined in:** `topic-reader.ts`

**Purpose:** Reads compiled topic pages from `04-topics`.

**Inputs:** `vaultPath` plus optional `domain` and `topic` filters.

**Output:** `CompiledTopic[]`.

**How it works:** Walks `04-topics`, excludes `index.md` and `log.md`, parses frontmatter with `gray-matter`, normalizes optional fields, trims content, and applies filters.

**Interactions:** Used by `askQuestion` for answer context and by `regenerateWikiIndex`.

**Errors/edge cases:** Missing `04-topics` returns an empty list. Missing frontmatter fields fall back to filename/title defaults or empty arrays.

## `uniquePath(dir, slug)`

**Defined in:** `answer-memory.ts`

**Purpose:** Finds a non-colliding Markdown path for a new answer memory.

**Inputs:** Target directory and filename slug.

**Output:** A path ending in `<slug>.md` or `<slug>-N.md`.

**How it works:** Checks for an existing file, then increments a numeric suffix starting at `2` until it finds an unused path.

**Interactions:** Used only by `writeAnswerMemory`.

**Errors/edge cases:** Filesystem existence checks can race if another process writes the same file between check and write.

## `writeAnswerMemory(options)`

**Defined in:** `answer-memory.ts`

**Purpose:** Saves a reusable answer as a raw Markdown source.

**Inputs:** Vault path, question, answer, title, domain, topic, tags, summary, and source paths.

**Output:** `{ path, relativePath }` for the written file.

**How it works:** Ensures `00-raw/answers` exists, slugifies the title or question, chooses a unique path, builds a body containing the question, answer, summary, and source topics, and writes frontmatter with `source_type: "answer"`.

**Interactions:** Called by `maybeSaveAnswerMemory` before recompiling the selected topic.

**Errors/edge cases:** Falls back to `answer-memory` if slugification returns an empty string. Filesystem write errors propagate.

## `formatTags(tags)`

**Defined in:** `wiki-index.ts`

**Purpose:** Formats tag arrays for one-line index entries.

**Inputs:** String tag array.

**Output:** Comma-separated tags or `none`.

**How it works:** Returns `none` for an empty array, otherwise joins tags with `, `.

**Interactions:** Used only by `regenerateWikiIndex`.

**Errors/edge cases:** Does not validate tag contents.

## `regenerateWikiIndex(options)`

**Defined in:** `wiki-index.ts`

**Purpose:** Rewrites the compiled topic index.

**Inputs:** `vaultPath`.

**Output:** Absolute path to `04-topics/index.md`.

**How it works:** Ensures `04-topics` exists, reads compiled topics, sorts them by domain/title, groups by domain, renders Obsidian links and metadata lines, and writes the index file.

**Interactions:** Called by `compileTopic` after one or more topic pages are written.

**Errors/edge cases:** Writes an index header even when there are no topics. Filesystem errors propagate.

## `formatLogDate(date)`

**Defined in:** `wiki-log.ts`

**Purpose:** Formats log dates.

**Inputs:** A `Date`.

**Output:** ISO date string in `YYYY-MM-DD` format.

**How it works:** Calls `toISOString()` and keeps the date portion.

**Interactions:** Used only by `appendWikiLogEntry`.

**Errors/edge cases:** Uses UTC date semantics because `toISOString()` is UTC.

## `CompileLogEntry`

**Defined in:** `wiki-log.ts`

**Purpose:** Type for compile log payloads.

**Fields:** Vault path, optional compile event marker, action, domain, topic, output path, and raw source count.

**Used by:** `appendWikiLogEntry` and `compileTopic`.

## `AskLogEntry`

**Defined in:** `wiki-log.ts`

**Purpose:** Type for ask log payloads.

**Fields:** Vault path, event name, question, selected topics, sources, memory save status, and optional memory path.

**Used by:** `appendWikiLogEntry` and `askQuestion`.

## `MemoryLogEntry`

**Defined in:** `wiki-log.ts`

**Purpose:** Type for answer-memory log payloads.

**Fields:** Vault path, event name, memory path, domain, and topic.

**Used by:** `appendWikiLogEntry` and `maybeSaveAnswerMemory`.

## `appendWikiLogEntry(options)`

**Defined in:** `wiki-log.ts`

**Purpose:** Appends an event to the wiki log.

**Inputs:** A compile, ask, or memory log entry.

**Output:** Absolute path to `04-topics/log.md`.

**How it works:** Ensures `04-topics` exists, creates the log file with a heading if missing, formats the current date, branches by event type, appends a Markdown section, and returns the log path.

**Interactions:** Called by `compileTopic`, `askQuestion`, and `maybeSaveAnswerMemory`.

**Errors/edge cases:** Compile entries are identified by the absence of `event: "ask"` or `event: "memory"`. Filesystem errors propagate.
