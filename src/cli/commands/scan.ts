import { scanSources } from '../../parsers/scan-sources.js'

export interface RunScanCommandOptions {
  homeDir: string
  projectDir: string
}

export interface ScanCommandResult {
  sources: Array<{
    tool: 'claude' | 'codex'
    scope: 'user' | 'project'
    path: string
  }>
}

export async function runScanCommand(
  options: RunScanCommandOptions
): Promise<ScanCommandResult> {
  const discovered = await scanSources(options)

  return {
    sources: [
      ...discovered.claude.map((item) => ({
        tool: item.tool,
        scope: item.scope,
        path: item.filePath
      })),
      ...discovered.codex.map((item) => ({
        tool: item.tool,
        scope: item.scope,
        path: item.filePath
      }))
    ]
  }
}
