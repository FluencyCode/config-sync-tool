import { access } from 'node:fs/promises'
import path from 'node:path'

export interface DiscoveredSource {
  tool: 'claude'
  scope: 'user' | 'project'
  type: 'settings' | 'instruction'
  filePath: string
}

const CLAUDE_CANDIDATES = [
  { relativePath: '.claude/settings.json', type: 'settings' as const },
  { relativePath: '.claude/CLAUDE.md', type: 'instruction' as const },
  { relativePath: 'CLAUDE.md', type: 'instruction' as const }
]

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export async function discoverClaudeSources(
  baseDir: string,
  scope: 'user' | 'project'
): Promise<DiscoveredSource[]> {
  const found: DiscoveredSource[] = []

  for (const candidate of CLAUDE_CANDIDATES) {
    const filePath = path.resolve(baseDir, candidate.relativePath)
    if (await exists(filePath)) {
      found.push({
        tool: 'claude',
        scope,
        type: candidate.type,
        filePath
      })
    }
  }

  return found
}
