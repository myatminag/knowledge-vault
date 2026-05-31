# Schema

Structured knowledge schemas belong here. These schemas define the contract between LLM output and Markdown rendering.

## Files

- `knowledge-schema.ts` defines the compiled topic shape.

## `KnowledgeSchema`

**Defined in:** `knowledge-schema.ts`

**Purpose:** Zod schema for compiled topic content returned by the LLM.

**Fields:** `title`, `summary`, `keyConcepts`, `deepDive`, `related`, and `openQuestions`. Key concepts contain `name` and `explanation`. Deep dives contain `heading` and `body`.

**Used by:** `compileTopic` passes this schema to `callStructured`; `renderTopicMarkdown` consumes the resulting knowledge object.

**Errors/edge cases:** The schema currently validates shapes and string types but does not enforce length, minimum array sizes, or Markdown rules. Those constraints live in prompts.

## `Knowledge`

**Defined in:** `knowledge-schema.ts`

**Purpose:** TypeScript type inferred from `KnowledgeSchema`.

**Fields:** Matches the compiled topic schema exactly.

**Used by:** `renderTopicMarkdown` and any code that needs a typed compiled knowledge object.
