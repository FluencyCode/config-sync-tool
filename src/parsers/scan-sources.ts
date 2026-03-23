import { discoverClaudeSources } from '../adapters/claude/discovery.js'
import { discoverCodexSources } from '../adapters/codex/discovery.js'

export interface ScanSourcesOptions {
  homeDir: string
  projectDir: string
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
    discoverClaudeSources(options.projectDir, 'project'),
    discoverCodexSources(options.homeDir, 'user'),
    discoverCodexSources(options.projectDir, 'project')
  ])

  return {
    claude: [...claudeUser, ...claudeProject],
    codex: [...codexUser, ...codexProject]
  }
}
