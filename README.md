# Knowledge Compiler

Knowledge Compiler is being rebuilt from scratch.

The goal is to create a local-first tool that turns source material into structured, durable knowledge artifacts. The previous implementation has been removed so the project can be rebuilt step by step with a simpler structure and clearer boundaries.

## Current Status

This repository is a clean scaffold. There is no working compiler implementation yet.

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

Implementation will happen incrementally:

1. Define the smallest useful compiler workflow.
2. Add tests for each behavior before implementation.
3. Build focused modules with clear responsibilities.
4. Document design decisions as the structure evolves.

## Setup

Install dependencies when the project has dependencies again:

```bash
bun install
```

Run tests:

```bash
bun test
```

At this stage, the test suite only verifies that the scaffold is ready.
