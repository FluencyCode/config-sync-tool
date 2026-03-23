import path from 'node:path'
import { buildSyncPlan } from '../../core/planner/build-sync-plan.js'
import { applySyncPlan } from '../../core/planner/apply-sync-plan.js'
import { loadStructuredFile } from '../../parsers/file-loader.js'
import { mapClaudeToUnified } from '../../adapters/claude/map-to-unified.js'
import { mapCodexToUnified } from '../../adapters/codex/map-to-unified.js'
import { mapUnifiedToClaude } from '../../adapters/claude/map-from-unified.js'
import { mapUnifiedToCodex } from '../../adapters/codex/map-from-unified.js'
import { runDiffCommand, type RunDiffCommandOptions } from './diff.js'

export interface SyncCommandResult {
  summary: {
    applied: number
    warnings: number
    skipped: number
  }
  appliedFiles: string[]
}

async function loadSourceUnifiedConfig(options: RunDiffCommandOptions) {
  if (options.from === 'claude') {
    const settings = (await loadStructuredFile(`${options.homeDir}/.claude/settings.json`)).data as Record<string, unknown>
    return mapClaudeToUnified({
      settings,
      ruleFiles: options.projectDir
        ? [
            {
              path: `${options.projectDir}/.claude/CLAUDE.md`,
              content: (await loadStructuredFile(`${options.projectDir}/.claude/CLAUDE.md`)).raw
            }
          ]
        : [],
      scope: options.projectDir ? 'project' : 'user'
    })
  }

  const config = (await loadStructuredFile(`${options.homeDir}/.codex/config.toml`)).data as Record<string, unknown>
  return mapCodexToUnified({
    config,
    scope: 'user',
    filePath: `${options.homeDir}/.codex/config.toml`
  })
}

function buildApplySteps(
  options: RunDiffCommandOptions,
  sourceConfig: Awaited<ReturnType<typeof loadSourceUnifiedConfig>>
) {
  const patch = options.to === 'claude'
    ? mapUnifiedToClaude(sourceConfig)
    : mapUnifiedToCodex(sourceConfig)

  return patch.files.map((file) => ({
    path: options.to === 'claude'
      ? path.join(
          file.path.endsWith('settings.json') ? options.homeDir : (options.projectDir ?? options.homeDir),
          file.path
        )
      : path.join(options.homeDir, file.path),
    content: file.content
  }))
}

export async function runSyncCommand(
  options: RunDiffCommandOptions
): Promise<SyncCommandResult> {
  const preview = await runDiffCommand(options)
  const plan = buildSyncPlan({
    mode: 'loose',
    diff: preview.diff
  })
  const sourceConfig = await loadSourceUnifiedConfig(options)
  const applyResult = await applySyncPlan({
    dryRun: options.dryRun,
    steps: buildApplySteps(options, sourceConfig)
  })

  return {
    summary: {
      applied: plan.applied.length,
      warnings: plan.warnings.length,
      skipped: plan.skipped.length
    },
    appliedFiles: applyResult.applied
  }
}
