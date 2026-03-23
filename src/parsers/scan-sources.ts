import { discoverClaudeSources } from '../adapters/claude/discovery.js'
import { discoverCodexSources } from '../adapters/codex/discovery.js'

export interface ScanSourcesOptions {
  homeDir: string
  projectDir?: string
}

export interface ScanSourcesResult {
  claude: Awaited<ReturnType<typeof discoverClaudeSources>>
  codex: Awaited<ReturnType<typeof discoverCodexSources>>
}

export async function scanSources(
  options: ScanSourcesOptions
): Promise<ScanSourcesResult> {
  const [claudeUser, claudeProject, codexUser, codexProject] = await Promise.all([
    discoverClaudeSources(options.homeDir, 'user'),
    options.projectDir ? discoverClaudeSources(options.projectDir, 'project') : Promise.resolve([]),
    discoverCodexSources(options.homeDir, 'user'),
    options.projectDir ? discoverCodexSources(options.projectDir, 'project') : Promise.resolve([])
  ])

  return {
    claude: [...claudeUser, ...claudeProject],
    codex: [...codexUser, ...codexProject]
  }
}
