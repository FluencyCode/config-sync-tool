# Config Sync Tool Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node.js + TypeScript local CLI that scans Claude/Codex config sources, normalizes them into a unified model, previews differences, and synchronizes MVP-supported objects with warnings for incompatible items.

**Architecture:** The implementation uses a platform-agnostic core (`model`, `normalize`, `diff`, `planner`) plus platform-specific adapters for Claude and Codex. File scanning/parsing feed a `UnifiedConfig`, then diff/planner/reporter layers produce dry-run previews and safe apply plans with backup support.

**Tech Stack:** Node.js, TypeScript, Vitest, Zod, TOML parser, YAML parser, Commander or CAC CLI

---

## File Structure

### New files to create

- `package.json` — project metadata, scripts, dependencies
- `tsconfig.json` — TypeScript compiler config
- `vitest.config.ts` — test runner config
- `src/cli/index.ts` — CLI entry and command registration
- `src/cli/commands/scan.ts` — `scan` command
- `src/cli/commands/diff.ts` — `diff` command
- `src/cli/commands/sync.ts` — `sync` command
- `src/cli/commands/doctor.ts` — `doctor` command
- `src/core/model/types.ts` — unified domain types
- `src/core/model/result.ts` — sync result / warning / skipped models
- `src/core/normalize/unified-config.ts` — normalization helpers
- `src/core/diff/diff-config.ts` — diff engine for unified config objects
- `src/core/planner/build-sync-plan.ts` — sync plan builder
- `src/core/planner/apply-sync-plan.ts` — plan applier with backup support
- `src/core/planner/conflict-policy.ts` — loose/strict conflict behavior
- `src/parsers/json-parser.ts` — JSON parsing helper
- `src/parsers/toml-parser.ts` — TOML parsing helper
- `src/parsers/yaml-parser.ts` — YAML parsing helper
- `src/parsers/markdown-parser.ts` — markdown text/rule extraction helper
- `src/parsers/file-loader.ts` — file read + parser dispatch
- `src/parsers/scan-sources.ts` — source discovery helpers
- `src/adapters/claude/discovery.ts` — Claude source detection
- `src/adapters/claude/parse.ts` — Claude raw parse + extraction
- `src/adapters/claude/map-to-unified.ts` — Claude → Unified
- `src/adapters/claude/map-from-unified.ts` — Unified → Claude patch model
- `src/adapters/codex/discovery.ts` — Codex source detection
- `src/adapters/codex/parse.ts` — Codex raw parse + extraction
- `src/adapters/codex/map-to-unified.ts` — Codex → Unified
- `src/adapters/codex/map-from-unified.ts` — Unified → Codex patch model
- `src/reporters/text-reporter.ts` — terminal output
- `src/reporters/json-reporter.ts` — machine-readable output
- `tests/core/model.types.test.ts` — unified model tests
- `tests/parsers/file-loader.test.ts` — parser dispatch tests
- `tests/adapters/claude.map-to-unified.test.ts` — Claude adapter tests
- `tests/adapters/codex.map-to-unified.test.ts` — Codex adapter tests
- `tests/core/diff/diff-config.test.ts` — diff tests
- `tests/core/planner/build-sync-plan.test.ts` — plan builder tests
- `tests/cli/scan.test.ts` — scan CLI tests
- `tests/cli/diff.test.ts` — diff CLI tests
- `tests/cli/sync.test.ts` — sync CLI tests
- `fixtures/claude/` — Claude sample config inputs
- `fixtures/codex/` — Codex sample config inputs

### Existing files to modify

- `docs/superpowers/specs/2026-03-23-config-sync-tool-design.md` — only if the implementation reveals a design correction

---

## Chunk 1: Bootstrap TypeScript CLI workspace

### Task 1: Create package metadata and scripts

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Write the failing workspace smoke test**

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('workspace metadata', () => {
  it('defines cli, build, and test scripts', () => {
    const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
    expect(pkg.type).toBe('module')
    expect(pkg.scripts.build).toBeTruthy()
    expect(pkg.scripts.test).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/core/workspace.test.ts`
Expected: FAIL because `package.json` or script fields do not exist yet.

- [ ] **Step 3: Write minimal workspace config**

Create `package.json` with:

```json
{
  "name": "config-sync-tool",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "config-sync": "dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx src/cli/index.ts",
    "test": "vitest run"
  }
}
```

Create `tsconfig.json` with NodeNext module resolution and `dist` output. Create `vitest.config.ts` with `tests/**/*.test.ts` include pattern.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/core/workspace.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts tests/core/workspace.test.ts
git commit -m "chore(cli): bootstrap typescript workspace"
```

### Task 2: Create CLI entry shell

**Files:**
- Create: `src/cli/index.ts`
- Test: `tests/cli/index.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { buildCli } from '../../src/cli/index'

describe('buildCli', () => {
  it('registers scan diff sync doctor commands', () => {
    const cli = buildCli()
    expect(cli.commands.map((item) => item.name())).toEqual(['scan', 'diff', 'sync', 'doctor'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/cli/index.test.ts`
Expected: FAIL with module not found

- [ ] **Step 3: Write minimal implementation**

Implement `buildCli()` that returns a configured Commander/CAC instance with four commands and empty handlers.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/cli/index.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/cli/index.ts tests/cli/index.test.ts
git commit -m "feat(cli): add command entry shell"
```

## Chunk 2: Define unified domain model and parser base

### Task 3: Define unified config model

**Files:**
- Create: `src/core/model/types.ts`
- Create: `src/core/model/result.ts`
- Test: `tests/core/model.types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { createEmptyUnifiedConfig } from '../../../src/core/model/types'

describe('createEmptyUnifiedConfig', () => {
  it('builds the expected empty structure', () => {
    expect(createEmptyUnifiedConfig('claude', 'project')).toMatchObject({
      profile: {},
      instructions: {
        systemRules: [],
        outputRules: [],
        safetyRules: [],
        projectRules: []
      },
      skills: [],
      agents: [],
      mcps: [],
      hooks: []
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/core/model.types.test.ts`
Expected: FAIL with missing factory/type exports

- [ ] **Step 3: Write minimal implementation**

Add all core interfaces and a `createEmptyUnifiedConfig(source, scope)` helper.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/core/model.types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/model/types.ts src/core/model/result.ts tests/core/model.types.test.ts
git commit -m "feat(core): define unified config model"
```

### Task 4: Build parser dispatch layer

**Files:**
- Create: `src/parsers/json-parser.ts`
- Create: `src/parsers/toml-parser.ts`
- Create: `src/parsers/yaml-parser.ts`
- Create: `src/parsers/markdown-parser.ts`
- Create: `src/parsers/file-loader.ts`
- Test: `tests/parsers/file-loader.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { loadStructuredFile } from '../../src/parsers/file-loader'

describe('loadStructuredFile', () => {
  it('dispatches by extension', async () => {
    const result = await loadStructuredFile('fixtures/codex/sample-config.toml')
    expect(result.format).toBe('toml')
    expect(result.data).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/parsers/file-loader.test.ts`
Expected: FAIL with loader/parser missing

- [ ] **Step 3: Write minimal implementation**

Implement file loading and parser dispatch for `.json`, `.toml`, `.yaml`, `.yml`, `.md`. Markdown parser can initially return raw text plus simple heading split metadata.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/parsers/file-loader.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/parsers/*.ts tests/parsers/file-loader.test.ts fixtures/codex/sample-config.toml
git commit -m "feat(parser): add structured file loader"
```

## Chunk 3: Discover and normalize Claude/Codex sources

### Task 5: Implement source discovery

**Files:**
- Create: `src/parsers/scan-sources.ts`
- Create: `src/adapters/claude/discovery.ts`
- Create: `src/adapters/codex/discovery.ts`
- Test: `tests/parsers/scan-sources.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { scanSources } from '../../src/parsers/scan-sources'

describe('scanSources', () => {
  it('finds claude and codex source groups from roots', async () => {
    const result = await scanSources({
      homeDir: 'fixtures/home',
      projectDir: 'fixtures/project'
    })
    expect(result.claude.length).toBeGreaterThan(0)
    expect(result.codex.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/parsers/scan-sources.test.ts`
Expected: FAIL with missing scanner logic

- [ ] **Step 3: Write minimal implementation**

Implement file existence checks and platform-specific discovery rules for:
- Claude user/project settings
- Claude rules/skills hints
- Codex user/project config files
- MCP-related config files where available

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/parsers/scan-sources.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/parsers/scan-sources.ts src/adapters/claude/discovery.ts src/adapters/codex/discovery.ts tests/parsers/scan-sources.test.ts fixtures/home fixtures/project
git commit -m "feat(scan): detect claude and codex config sources"
```

### Task 6: Implement Claude and Codex normalization

**Files:**
- Create: `src/adapters/claude/parse.ts`
- Create: `src/adapters/claude/map-to-unified.ts`
- Create: `src/adapters/codex/parse.ts`
- Create: `src/adapters/codex/map-to-unified.ts`
- Create: `src/core/normalize/unified-config.ts`
- Test: `tests/adapters/claude.map-to-unified.test.ts`
- Test: `tests/adapters/codex.map-to-unified.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { mapClaudeToUnified } from '../../src/adapters/claude/map-to-unified'

describe('mapClaudeToUnified', () => {
  it('maps settings and rules into unified config', async () => {
    const result = await mapClaudeToUnified({ /* fixture input */ })
    expect(result.profile.model).toBe('opus')
    expect(result.instructions.systemRules.length).toBeGreaterThan(0)
  })
})
```

```ts
import { describe, expect, it } from 'vitest'
import { mapCodexToUnified } from '../../src/adapters/codex/map-to-unified'

describe('mapCodexToUnified', () => {
  it('maps root config into unified config', async () => {
    const result = await mapCodexToUnified({ /* fixture input */ })
    expect(result.profile.approvalPolicy).toBe('on-request')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/adapters/claude.map-to-unified.test.ts tests/adapters/codex.map-to-unified.test.ts`
Expected: FAIL with missing mapping logic

- [ ] **Step 3: Write minimal implementation**

Map the MVP-supported objects:
- basic profile fields
- instruction/rule text blocks
- MCP entries
- skill/agent metadata placeholders
- scope/source metadata

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/adapters/claude.map-to-unified.test.ts tests/adapters/codex.map-to-unified.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/adapters/claude/*.ts src/adapters/codex/*.ts src/core/normalize/unified-config.ts tests/adapters/claude.map-to-unified.test.ts tests/adapters/codex.map-to-unified.test.ts
git commit -m "feat(adapter): normalize claude and codex configs"
```

## Chunk 4: Diff and sync planning

### Task 7: Build unified diff engine

**Files:**
- Create: `src/core/diff/diff-config.ts`
- Test: `tests/core/diff/diff-config.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { diffUnifiedConfig } from '../../../src/core/diff/diff-config'

describe('diffUnifiedConfig', () => {
  it('reports profile and rules differences', () => {
    const diff = diffUnifiedConfig(sourceConfig, targetConfig)
    expect(diff.profileChanges.length).toBe(1)
    expect(diff.ruleChanges.length).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/core/diff/diff-config.test.ts`
Expected: FAIL with diff engine missing

- [ ] **Step 3: Write minimal implementation**

Implement comparison for MVP fields:
- profile keys
- rule blocks
- MCP entries by name
- skill/agent metadata deltas

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/core/diff/diff-config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/diff/diff-config.ts tests/core/diff/diff-config.test.ts
git commit -m "feat(diff): compare unified configs"
```

### Task 8: Build sync plan generator

**Files:**
- Create: `src/core/planner/conflict-policy.ts`
- Create: `src/core/planner/build-sync-plan.ts`
- Test: `tests/core/planner/build-sync-plan.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { buildSyncPlan } from '../../../src/core/planner/build-sync-plan'

describe('buildSyncPlan', () => {
  it('creates applied, warning, skipped, and manual action buckets', () => {
    const plan = buildSyncPlan({
      mode: 'loose',
      diff: sampleDiff
    })
    expect(plan.warnings.length).toBeGreaterThan(0)
    expect(plan.steps.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/core/planner/build-sync-plan.test.ts`
Expected: FAIL with plan builder missing

- [ ] **Step 3: Write minimal implementation**

Implement loose-mode planner:
- compatible changes -> `applied`
- partial mappings -> `warnings`
- unsupported mappings -> `skipped`/`manualActions`
- attach target files and backup requirements

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/core/planner/build-sync-plan.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/planner/conflict-policy.ts src/core/planner/build-sync-plan.ts tests/core/planner/build-sync-plan.test.ts
git commit -m "feat(plan): generate loose sync plans"
```

## Chunk 5: Target mapping and apply flow

### Task 9: Implement target-side mapping

**Files:**
- Create: `src/adapters/claude/map-from-unified.ts`
- Create: `src/adapters/codex/map-from-unified.ts`
- Test: `tests/adapters/claude.map-from-unified.test.ts`
- Test: `tests/adapters/codex.map-from-unified.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { mapUnifiedToCodex } from '../../src/adapters/codex/map-from-unified'

describe('mapUnifiedToCodex', () => {
  it('creates target patches for supported MVP fields', () => {
    const result = mapUnifiedToCodex(unifiedConfig)
    expect(result.files.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/adapters/claude.map-from-unified.test.ts tests/adapters/codex.map-from-unified.test.ts`
Expected: FAIL with missing target mappers

- [ ] **Step 3: Write minimal implementation**

Produce patch models for:
- profile fields
- instruction text outputs
- MCP entries
- warning annotations for partial mappings

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/adapters/claude.map-from-unified.test.ts tests/adapters/codex.map-from-unified.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/adapters/claude/map-from-unified.ts src/adapters/codex/map-from-unified.ts tests/adapters/claude.map-from-unified.test.ts tests/adapters/codex.map-from-unified.test.ts
git commit -m "feat(adapter): map unified config to target patches"
```

### Task 10: Implement apply flow with backup

**Files:**
- Create: `src/core/planner/apply-sync-plan.ts`
- Test: `tests/core/planner/apply-sync-plan.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { applySyncPlan } from '../../../src/core/planner/apply-sync-plan'

describe('applySyncPlan', () => {
  it('writes backups before applying file changes', async () => {
    const result = await applySyncPlan(samplePlan)
    expect(result.backupsCreated.length).toBe(1)
    expect(result.applied.length).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/core/planner/apply-sync-plan.test.ts`
Expected: FAIL with missing applier

- [ ] **Step 3: Write minimal implementation**

Implement:
- backup file creation
- dry-run short-circuit
- target file write
- apply summary result

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/core/planner/apply-sync-plan.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/planner/apply-sync-plan.ts tests/core/planner/apply-sync-plan.test.ts
git commit -m "feat(apply): support backup and sync apply flow"
```

## Chunk 6: CLI commands and reporting

### Task 11: Implement `scan` and `doctor` commands

**Files:**
- Create: `src/cli/commands/scan.ts`
- Create: `src/cli/commands/doctor.ts`
- Create: `src/reporters/text-reporter.ts`
- Create: `src/reporters/json-reporter.ts`
- Test: `tests/cli/scan.test.ts`
- Test: `tests/cli/doctor.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { runScanCommand } from '../../src/cli/commands/scan'

describe('runScanCommand', () => {
  it('returns discovered source summaries', async () => {
    const result = await runScanCommand({ projectDir: 'fixtures/project' })
    expect(result.sources.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/cli/scan.test.ts tests/cli/doctor.test.ts`
Expected: FAIL with command handlers missing

- [ ] **Step 3: Write minimal implementation**

Implement:
- `scan`: discovered source summary
- `doctor`: unsupported file/field warnings and conflict hints
- text/json reporter output modes

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/cli/scan.test.ts tests/cli/doctor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/cli/commands/scan.ts src/cli/commands/doctor.ts src/reporters/*.ts tests/cli/scan.test.ts tests/cli/doctor.test.ts
git commit -m "feat(cli): add scan and doctor commands"
```

### Task 12: Implement `diff` and `sync` commands

**Files:**
- Create: `src/cli/commands/diff.ts`
- Create: `src/cli/commands/sync.ts`
- Test: `tests/cli/diff.test.ts`
- Test: `tests/cli/sync.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { runDiffCommand } from '../../src/cli/commands/diff'

describe('runDiffCommand', () => {
  it('returns a preview without applying changes in dry-run mode', async () => {
    const result = await runDiffCommand(sampleArgs)
    expect(result.mode).toBe('preview')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/cli/diff.test.ts tests/cli/sync.test.ts`
Expected: FAIL with missing command handlers

- [ ] **Step 3: Write minimal implementation**

Implement:
- `diff`: source/target parse -> normalized diff -> preview report
- `sync`: parse -> diff -> build plan -> optional apply
- support `--dry-run`, `--from`, `--to`, `--bidirectional`, `--format`

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/cli/diff.test.ts tests/cli/sync.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/cli/commands/diff.ts src/cli/commands/sync.ts tests/cli/diff.test.ts tests/cli/sync.test.ts
git commit -m "feat(cli): add diff and sync commands"
```

## Chunk 7: End-to-end verification and cleanup

### Task 13: Add fixture-based integration coverage

**Files:**
- Modify: `fixtures/claude/*`
- Modify: `fixtures/codex/*`
- Create: `tests/integration/mvp-sync.test.ts`

- [ ] **Step 1: Write the failing integration test**

```ts
import { describe, expect, it } from 'vitest'
import { runSyncCommand } from '../../src/cli/commands/sync'

describe('mvp sync integration', () => {
  it('builds a dry-run sync report from claude to codex', async () => {
    const result = await runSyncCommand({
      from: 'claude',
      to: 'codex',
      dryRun: true,
      projectDir: 'fixtures/project'
    })
    expect(result.summary.applied + result.summary.warnings + result.summary.skipped).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/mvp-sync.test.ts`
Expected: FAIL until the full pipeline is wired

- [ ] **Step 3: Write minimal implementation/fix wiring**

Fill fixture gaps and connect the command pipeline end to end so the dry-run report is generated from real fixture inputs.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration/mvp-sync.test.ts`
Expected: PASS

- [ ] **Step 5: Run full verification**

Run: `npm test`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add fixtures tests/integration/mvp-sync.test.ts src
git commit -m "test(mvp): verify end-to-end dry-run sync flow"
```

### Task 14: Verify build output and CLI usability

**Files:**
- Modify: `package.json`
- Modify: `src/cli/index.ts`
- Test: existing CLI tests

- [ ] **Step 1: Write the failing build/usability test**

```ts
import { describe, expect, it } from 'vitest'
import { execa } from 'execa'

describe('cli usability', () => {
  it('prints help successfully', async () => {
    const result = await execa('node', ['dist/cli/index.js', '--help'])
    expect(result.stdout).toContain('config-sync')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build && npm test -- tests/cli/usability.test.ts`
Expected: FAIL until build output/help text is stable

- [ ] **Step 3: Write minimal implementation**

Ensure build emits runnable CLI code and help text includes the four commands and primary options.

- [ ] **Step 4: Run final verification**

Run: `npm run build && npm test`
Expected: Build succeeds and all tests PASS

- [ ] **Step 5: Commit**

```bash
git add package.json src/cli/index.ts tests/cli/usability.test.ts
git commit -m "chore(cli): verify built command usability"
```

---

## Notes for implementation

- Prefer `commander` if you want stronger command object assertions in tests; prefer `cac` if you want a lighter CLI layer.
- Use `zod` at parser/adapter boundaries to reject malformed external data early.
- Keep markdown rule extraction simple in MVP: raw block migration is acceptable.
- Preserve unknown target-side fields when writing JSON/TOML objects; MVP should not destructively rewrite files.
- Skills and agents are metadata-first in MVP. Do not overdesign runtime behavior emulation.
- Default all sync operations to dry-run unless the user explicitly passes apply mode.

## Verification checklist

- `npm test`
- `npm run build`
- Manual smoke test:
  - `node dist/cli/index.js scan --project <path>`
  - `node dist/cli/index.js diff --from claude --to codex --dry-run --project <path>`
  - `node dist/cli/index.js sync --from claude --to codex --dry-run --project <path>`
  - `node dist/cli/index.js doctor --project <path>`

Plan complete and saved to `docs/superpowers/plans/2026-03-23-config-sync-tool.md`. Ready to execute?
