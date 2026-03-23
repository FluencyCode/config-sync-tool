import { access } from 'node:fs/promises'
import path from 'node:path'

export interface DiscoveredSource {
  tool: 'codex'
  scope: 'user' | 'project'
  type: 'config'
  filePath: string
}

const CODEX_CANDIDATES = [
  '.codex/config.toml',
  'codex.toml'
]

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export async function discoverCodexSources(
  baseDir: string,
  scope: 'user' | 'project'
): Promise<DiscoveredSource[]> {
  const found: DiscoveredSource[] = []

  for (const relativePath of CODEX_CANDIDATES) {
    const filePath = path.resolve(baseDir, relativePath)
    if (await exists(filePath)) {
      found.push({
        tool: 'codex',
        scope,
        type: 'config',
        filePath
      })
    }
  }

  return found
}
