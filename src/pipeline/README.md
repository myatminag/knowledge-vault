# Pipeline

Composable workflow stages belong here. Pipeline modules should stay small and explicit about their inputs and outputs.

## Current State

This folder currently contains no TypeScript implementation files. The active workflow orchestration lives in `src/core/`.

## Intended Boundary

Future pipeline modules should represent reusable workflow stages that can be composed by core use cases. A stage should make its input, output, side effects, and failure behavior explicit.

## Interaction Notes

- `src/core/` should remain responsible for user-level use cases.
- `src/pipeline/` should only receive code when a workflow step becomes reusable enough to extract from core.
- Add function-level documentation here when implementation files are introduced.
