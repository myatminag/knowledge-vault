# Render

Markdown, frontmatter, metadata, and knowledge artifact rendering belong here.

## Files

- `topic-markdown.ts` renders a structured `Knowledge` object into a compiled Markdown topic page.

## `formatObsidianDate(date)`

**Defined in:** `topic-markdown.ts`

**Purpose:** Formats dates for topic frontmatter.

**Inputs:** A `Date`.

**Output:** ISO date string in `YYYY-MM-DD` format.

**How it works:** Calls `toISOString()` and keeps the first ten characters.

**Interactions:** Used only by `renderTopicMarkdown`.

**Errors/edge cases:** Uses UTC date semantics because `toISOString()` is UTC.

## `renderList(items)`

**Defined in:** `topic-markdown.ts`

**Purpose:** Renders a plain Markdown bullet list.

**Inputs:** String array.

**Output:** Array of Markdown bullet lines.

**How it works:** Returns `- None` for an empty array; otherwise prefixes each item with `- `.

**Interactions:** Used by `renderTopicMarkdown` for open questions.

**Errors/edge cases:** Does not trim or validate items.

## `renderRelated(items)`

**Defined in:** `topic-markdown.ts`

**Purpose:** Renders related topic names as Obsidian links.

**Inputs:** String array.

**Output:** Array of Markdown bullet lines.

**How it works:** Returns `- None` for an empty array. Existing `[[...]]` links are preserved. Other values are wrapped as `[[value]]`.

**Interactions:** Used by `renderTopicMarkdown` for the Related section.

**Errors/edge cases:** Trims only for link detection and wrapping.

## `renderSources(sources)`

**Defined in:** `topic-markdown.ts`

**Purpose:** Renders source references as Obsidian alias links.

**Inputs:** Source objects with `title` and `relativePath`.

**Output:** Array of Markdown bullet lines.

**How it works:** Returns `- None` for an empty array. For each source, derives the raw note name from the relative filename, title-cases the display title, and returns `[[rawName|Title]]`.

**Interactions:** Used by `renderTopicMarkdown` for the Sources section.

**Errors/edge cases:** If the relative path has no filename, the raw link target may be `undefined`.

## `renderTopicMarkdown(options)`

**Defined in:** `topic-markdown.ts`

**Purpose:** Converts structured knowledge and metadata into a compiled topic Markdown file.

**Inputs:** `knowledge`, `domain`, `topic`, `tags`, optional `createdAt`, and source records.

**Output:** Markdown string with YAML frontmatter.

**How it works:** Formats the current date, deduplicates source paths, builds body sections for title, summary, key concepts, deep dives, related topics, open questions, and sources, then wraps the body with `gray-matter` frontmatter.

**Interactions:** Called by `compileTopic` after the LLM returns `KnowledgeSchema` output.

**Errors/edge cases:** Preserves `created_at` when provided and always refreshes `updated_at`. Does not write files; filesystem persistence happens in `compileTopic`.
