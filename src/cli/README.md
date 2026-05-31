# CLI

Command-line entry points, argument parsing, and user-facing command wiring belong here.

## Files

- `index.ts` provides the yargs-based multi-command CLI named `norra`.
- `ask.ts` provides the `bun run ask` script entry.
- `seed.ts` provides the `bun run seed` script entry.
- `compile.ts` provides the `bun run compile` script entry.

## `printAskResult(result)`

**Defined in:** `index.ts`

**Purpose:** Prints the result of `askQuestionWithAutoCompile` in a consistent CLI format.

**Inputs:** The awaited return value of `askQuestionWithAutoCompile`.

**Output:** No return value; writes to stdout.

**How it works:** Prints whether the raw seed was created or reused, lists compiled paths, prints the answer, and lists sources.

**Interactions:** Used by the `ask` command and the interactive `repl` command in `index.ts`.

**Errors/edge cases:** Assumes the result has already been produced successfully. It does not catch output errors.

## Yargs command chain

**Defined in:** `index.ts`

**Purpose:** Registers the interactive CLI surface.

**Inputs:** `process.argv` via `hideBin`.

**Output:** Executes a command handler and writes output to stdout/stderr.

**How it works:** Defines `ask <question>`, `seed <question>`, `compile`, and `repl`; requires at least one command; enables strict parsing and help output.

**Interactions:** Calls `askQuestionWithAutoCompile`, `seedTopic`, and `compileTopic`.

**Errors/edge cases:** yargs handles missing commands and invalid options. Individual handlers let thrown errors reject unless they catch internally.

## `ask <question>` command

**Defined in:** `index.ts`

**Purpose:** Seeds raw knowledge if needed, compiles the classified topic, and answers the question.

**Inputs:** Required positional `question`.

**Output:** Prints seed status, compiled paths, answer text, and sources.

**How it works:** Calls `askQuestionWithAutoCompile(String(argv.question))`, then prints the result.

**Interactions:** Uses `core/ask-question.ts`.

**Errors/edge cases:** The current handler prints the result through `printAskResult` and then repeats equivalent output inline, so successful output is duplicated.

## `seed <question>` command

**Defined in:** `index.ts`

**Purpose:** Creates a raw seed note from a question.

**Inputs:** Required positional `question`.

**Output:** Prints classification metadata and the raw seed path.

**How it works:** Calls `seedTopic` with the question string and prints returned classification fields.

**Interactions:** Uses `scripts/seed-topic.ts`.

**Errors/edge cases:** Existing raw seed behavior follows `seedTopic` defaults, which means duplicate seeds throw.

## `compile` command

**Defined in:** `index.ts`

**Purpose:** Compiles raw sources into topic pages.

**Inputs:** Optional `--domain` and `--topic` strings.

**Output:** `compileTopic` prints each compiled path. The command prints `No matching raw sources found.` when nothing matches.

**How it works:** Passes optional filters directly to `compileTopic`.

**Interactions:** Uses `core/compile-topic.ts`.

**Errors/edge cases:** LLM, ingest, and filesystem errors propagate.

## `repl` command

**Defined in:** `index.ts`

**Purpose:** Starts an interactive question loop.

**Inputs:** User text from stdin.

**Output:** Prints answers and sources for each question.

**How it works:** Creates a readline interface, prompts with `norra>`, ignores blank input, exits on `exit` or `quit`, and calls `askQuestionWithAutoCompile` for each question.

**Interactions:** Uses `printAskResult` and `core/ask-question.ts`.

**Errors/edge cases:** Catches per-question errors, prints an error message, and keeps the loop alive. Always closes the readline interface in `finally`.

## `args`

**Defined in:** `ask.ts` and `compile.ts`

**Purpose:** Captures raw command-line arguments for small Bun script entry points.

**Inputs:** `process.argv.slice(2)`.

**Output:** Local array used by manual parsers.

**How it works:** Removes the runtime and script path from argv.

**Interactions:** Used by each file's top-level command body.

## `ask.ts` top-level command

**Defined in:** `ask.ts`

**Purpose:** Answers a question using already compiled topics.

**Inputs:** Free-form question words plus optional `--domain <value>` and `--topic <value>`.

**Output:** Prints answer text and source paths.

**How it works:** Manually parses options, joins remaining args into a question, calls `askQuestion`, and catches errors.

**Interactions:** Uses `core/ask-question.ts`.

**Errors/edge cases:** Throws a clear error if `--domain` or `--topic` has no value. On any error, prints to stderr and exits with status `1`.

## `seed.ts` top-level command

**Defined in:** `seed.ts`

**Purpose:** Creates a raw seed note from a question.

**Inputs:** All command-line arguments joined into one question string.

**Output:** Prints title, domain, topic, tags, and raw seed path.

**How it works:** Calls `seedTopic(question)` and catches errors.

**Interactions:** Uses `scripts/seed-topic.ts`.

**Errors/edge cases:** Blank questions fail inside `classifyTopic`. Duplicate raw seeds fail inside `createRawSeed`. On error, exits with status `1`.

## `getOptionValue(name)`

**Defined in:** `compile.ts`

**Purpose:** Reads a named `--option value` pair from raw CLI args.

**Inputs:** Option name without leading dashes.

**Output:** The option value string or `undefined`.

**How it works:** Finds `--${name}` in `args`, reads the following value, and rejects missing or option-looking values.

**Interactions:** Used by `compile.ts` for `domain` and `topic`.

**Errors/edge cases:** Throws `--${name} requires a value` when the flag has no usable value.

## `compile.ts` top-level command

**Defined in:** `compile.ts`

**Purpose:** Compiles raw sources into topic pages.

**Inputs:** Optional `--domain` and `--topic` flags.

**Output:** Lets `compileTopic` print compiled paths and prints `No matching raw sources found.` for empty results.

**How it works:** Reads option values with `getOptionValue`, calls `compileTopic`, and catches errors.

**Interactions:** Uses `core/compile-topic.ts`.

**Errors/edge cases:** On parser, LLM, ingest, or filesystem errors, prints a labeled error and exits with status `1`.
