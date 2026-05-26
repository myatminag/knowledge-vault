# Knowledge Compiler

Knowledge Compiler is a local-first tool for turning source material into structured, durable Markdown knowledge artifacts.

It keeps raw inputs and compiled topics in a local vault, uses OpenAI structured generation to classify and synthesize material, and exposes small Bun-powered CLI commands for seeding, compiling, and asking questions over the compiled knowledge base.

## Current Status

The project has an initial end-to-end workflow:

1. Seed a raw note from a question.
2. Compile raw Markdown sources into topic pages.
3. Ask questions using the compiled topic pages as context.

This is still early software. The workflow is intentionally small, local, and file-based while the project boundaries settle.

## Requirements

- [Bun](https://bun.sh/)
- An OpenAI API key

Install dependencies:

```bash
bun install
```

Create a `.env` file:

```bash
OPENAI_API_KEY=your_api_key
KNOWLEDGE_VAULT_PATH=/absolute/path/to/your/knowledge-vault
```

`KNOWLEDGE_VAULT_PATH` is optional. If it is not set, the app uses `~/knowledge-vault`.

Optional:

```bash
OPENAI_BASE_URL=https://your-compatible-openai-endpoint.example
```

## Commands

Seed a raw source note from a question:

```bash
bun run seed "How does consistent hashing work?"
```

Compile all raw sources into topic pages:

```bash
bun run compile
```

Ask a question over compiled topics:

```bash
bun run ask "When should I use consistent hashing?"
```

Run the test suite:

```bash
bun test
```

## Vault Layout

Knowledge Compiler reads and writes Markdown files inside the configured vault.

```text
knowledge-vault/
  00-raw/
    consistent-hashing.md
  04-topics/
    System Design/
      consistent-hashing.md
```

Raw source files must include frontmatter that matches the ingest schema:

```markdown
---
title: Consistent Hashing
domain: System Design
topic: Consistent Hashing
tags:
  - distributed-systems
source_type: note
source_url: https://example.com/optional-source
---

Your raw source material goes here.
```

Compiled topic pages include structured sections such as summary, key concepts, deep dives, related topics, open questions, and sources.

## Project Structure

```text
knowledge-compiler/
  src/
    cli/        command-line entry points and argument handling
    config/     environment and runtime configuration
    core/       compiler use cases and domain orchestration
    ingest/     source adapters and input normalization
    llm/        AI provider boundary and structured generation
    pipeline/   composable workflow stages
    render/     Markdown and metadata rendering
    schema/     structured knowledge schemas
    shared/     small cross-cutting utilities
    storage/    filesystem and vault persistence
  tests/
    unit/        isolated module tests
    integration/ end-to-end workflow tests
    fixtures/    reusable test inputs and expected outputs
  scripts/       local development and maintenance scripts
  docs/
    decisions/   architecture decision records
    plans/       implementation plans
    reference/   product and technical notes
```

## Development Approach

Implementation happens incrementally:

1. Keep the core workflow small and testable.
2. Add tests around behavior before expanding capabilities.
3. Preserve clear module boundaries between CLI, core orchestration, storage, rendering, ingest, and LLM access.
4. Document design decisions as the structure evolves.

## Notes

- LLM calls currently use `gpt-5-mini`.
- Raw sources are scanned from `00-raw`.
- Compiled topics are written under `04-topics`.
- The project uses path aliases from `tsconfig.json`, with `@/*` mapped to `src/*`.
