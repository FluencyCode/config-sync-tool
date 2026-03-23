import { loadStructuredFile } from '../../parsers/file-loader.js'
import { diffUnifiedConfig } from '../../core/diff/diff-config.js'
import { mapClaudeToUnified } from '../../adapters/claude/map-to-unified.js'
import { mapCodexToUnified } from '../../adapters/codex/map-to-unified.js'

export interface RunDiffCommandOptions {
  from: 'claude' | 'codex'
  to: 'claude' | 'codex'
  dryRun: boolean
  homeDir: string
  projectDir: string
}

export interface DiffCommandResult {
  mode: 'preview'
  diff: ReturnType<typeof diffUnifiedConfig>
}

async function loadClaudeProject(projectDir: string, homeDir: string) {
  const settings = (await loadStructuredFile(`${homeDir}/.claude/settings.json`)).data as Record<string, unknown>
  return mapClaudeToUnified({
    settings,
    ruleFiles: [
      {
        path: `${projectDir}/.claude/CLAUDE.md`,
        content: (await loadStructuredFile(`${projectDir}/.claude/CLAUDE.md`)).raw
      }
    ],
    scope: 'project'
  })
}

async function loadCodexHome(homeDir: string) {
  const config = (await loadStructuredFile(`${homeDir}/.codex/config.toml`)).data as Record<string, unknown>
  return mapCodexToUnified({
    config,
    scope: 'user',
    filePath: `${homeDir}/.codex/config.toml`
  })
}

export async function runDiffCommand(
  options: RunDiffCommandOptions
): Promise<DiffCommandResult> {
  const source = options.from === 'claude'
    ? await loadClaudeProject(options.projectDir, options.homeDir)
    : await loadCodexHome(options.homeDir)
  const target = options.to === 'codex'
    ? await loadCodexHome(options.homeDir)
    : await loadClaudeProject(options.projectDir, options.homeDir)

  return {
    mode: 'preview',
    diff: diffUnifiedConfig(source, target)
  }
}
