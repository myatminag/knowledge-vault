# Ingest

Source adapters and input normalization belong here. The current implementation reads raw Markdown files from the local vault.

## Files

- `raw-source.ts` defines raw source frontmatter, raw source records, and raw source scanning.

## `rawSourceSchema`

**Defined in:** `raw-source.ts`

**Purpose:** Validates frontmatter for raw source Markdown files.

**Fields:** `title`, `domain`, and `topic` are required non-empty strings. `tags` defaults to `[]`. `source_type` defaults to `note`. `source_url` is optional and must be a URL.

**Used by:** `scanRawSources`.

## `RawSourceMeta`

**Defined in:** `raw-source.ts`

**Purpose:** TypeScript type inferred from `rawSourceSchema`.

**Fields:** Validated raw source metadata fields.

**Used by:** `RawSource` and compile-time callers.

## `RawSource`

**Defined in:** `raw-source.ts`

**Purpose:** Represents one parsed raw Markdown source.

**Fields:** Absolute file `path`, validated `meta`, and trimmed Markdown `body`.

**Used by:** `compileTopic` and helper functions in `src/core/compile-topic.ts`.

## `walkMarkdownFiles(dir)`

**Defined in:** `raw-source.ts`

**Purpose:** Recursively discovers Markdown files under a raw source directory.

**Inputs:** Directory path.

**Output:** Sorted array of Markdown file paths.

**How it works:** Returns an empty array if the directory does not exist, recursively walks child directories, collects files ending in `.md`, and sorts the final list.

**Interactions:** Used only by `scanRawSources`.

**Errors/edge cases:** Missing directories are treated as empty. Filesystem read errors propagate.

## `scanRawSources(dir)`

**Defined in:** `raw-source.ts`

**Purpose:** Reads raw Markdown sources and validates their frontmatter.

**Inputs:** Raw source directory path, usually `<vault>/00-raw`.

**Output:** `RawSource[]`.

**How it works:** Returns an empty list if the directory does not exist, walks Markdown files recursively, parses each file with `gray-matter`, validates frontmatter with `rawSourceSchema`, and returns path, metadata, and trimmed body.

**Interactions:** Called by `compileTopic`.

**Errors/edge cases:** Throws `Invalid raw source frontmatter in <path>: <message>` when frontmatter fails validation. File read and parse errors propagate.
