# Config

Runtime configuration, environment loading, and validation belong here.

## Files

- `config.ts` loads `.env`, validates environment variables, and exports a runtime config object.

## `envSchema`

**Defined in:** `config.ts`

**Purpose:** Zod schema for environment variables used by the app.

**Fields:** `OPENAI_API_KEY` is required and non-empty. `OPENAI_BASE_URL` is optional and must be a URL when present. `KNOWLEDGE_VAULT_PATH` defaults to `~/knowledge-vault`.

**Used by:** `loadConfig`.

## `loadConfig()`

**Defined in:** `config.ts`

**Purpose:** Validates environment variables and builds the runtime config object.

**Inputs:** Reads `process.env`; no explicit parameters.

**Output:** Object with `openai` settings and `vault.path`.

**How it works:** Loads `.env` through `dotenv/config`, validates `process.env` with `envSchema`, prints flattened field errors on validation failure, and returns a config object.

**Interactions:** Called once at module import time to initialize exported `config`.

**Errors/edge cases:** Throws `Invalid environment configuration` if validation fails.

## `config`

**Defined in:** `config.ts`

**Purpose:** Shared runtime configuration.

**Fields:** `openai.apiKey`, optional `openai.baseUrl`, and `vault.path`.

**Used by:** LLM client setup, core orchestration, storage path resolution, and seed scripts.

**Runtime behavior:** `vault.path` is a getter. It reads the latest `process.env.KNOWLEDGE_VAULT_PATH` if present, otherwise it uses the value validated during `loadConfig`.

## `Config`

**Defined in:** `config.ts`

**Purpose:** TypeScript type for the exported `config` object.

**Fields:** Inferred from `config`, including the `openai` object and `vault.path` getter shape.

**Used by:** Available for modules that need the config type.
