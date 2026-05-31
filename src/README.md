# Source Structure

Application code lives here. Each folder owns one boundary of the compiler so implementation can grow in small, testable steps.

## Folder Responsibilities

- `cli/` translates command-line arguments into core use-case calls and prints user-facing output.
- `config/` loads and validates environment configuration.
- `core/` orchestrates complete use cases: classify, compile, ask, save answer memory, and auto-compile.
- `ingest/` reads raw Markdown files from the vault and validates their frontmatter.
- `llm/` wraps OpenAI calls and structured generation.
- `pipeline/` is reserved for future workflow-stage composition.
- `render/` turns structured knowledge objects into Markdown topic pages.
- `schema/` defines structured data contracts shared by the LLM and renderer.
- `storage/` owns filesystem paths, topic reads, index writes, log writes, and answer-memory writes.

## Cross-Folder Flow

The most complete path is `askQuestionWithAutoCompile`:

1. `core/ask-question.ts` calls `scripts/seed-topic.ts`.
2. `scripts/seed-topic.ts` calls `core/topic-classification.ts` and `scripts/create-raw-seed.ts`.
3. `core/topic-classification.ts` calls `llm/structured.ts`.
4. `core/compile-topic.ts` scans raw sources through `ingest/raw-source.ts`.
5. `core/compile-topic.ts` calls `llm/structured.ts`, validates against `schema/knowledge-schema.ts`, renders with `render/topic-markdown.ts`, and persists through `storage/`.
6. `core/ask-question.ts` reads topics from `storage/topic-reader.ts`, selects topics through `llm/retrieval.ts`, answers through `llm/answer.ts`, and may write answer memory through `storage/answer-memory.ts`.

## Public Module Surfaces

- Core exports use-case functions for CLI and script entry points.
- LLM exports provider-level functions that hide OpenAI request details from core.
- Storage exports vault read/write helpers that keep path logic out of orchestration code.
- Render exports one topic Markdown renderer.
- Ingest exports raw source schemas and scanner output.
- Schema exports the compiled knowledge contract.

## Side Effects

Most folders are pure boundaries around specific side effects:

- `config/` reads environment variables.
- `llm/` calls OpenAI.
- `ingest/` reads Markdown files.
- `render/` returns strings without writing files.
- `storage/` reads and writes vault files.
- `core/` coordinates all of the above.
