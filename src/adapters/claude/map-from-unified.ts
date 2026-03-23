import type { UnifiedConfig } from '../../core/model/types.js'

export interface TargetPatchFile {
  path: string
  content: string
}

export interface ClaudePatchResult {
  files: TargetPatchFile[]
  warnings: string[]
}

export function mapUnifiedToClaude(config: UnifiedConfig): ClaudePatchResult {
  const files: TargetPatchFile[] = []

  files.push({
    path: '.claude/settings.json',
    content: JSON.stringify(
      {
        model: config.profile.model
      },
      null,
      2
    )
  })

  if (config.instructions.systemRules.length > 0) {
    files.push({
      path: '.claude/CLAUDE.md',
      content: config.instructions.systemRules.map((rule) => rule.content).join('\n\n')
    })
  }

  return {
    files,
    warnings: []
  }
}
