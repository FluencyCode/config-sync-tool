import type { UnifiedConfig } from '../../core/model/types.js'

export interface TargetPatchFile {
  path: string
  content: string
}

export interface CodexPatchResult {
  files: TargetPatchFile[]
  warnings: string[]
}

export function mapUnifiedToCodex(config: UnifiedConfig): CodexPatchResult {
  const lines: string[] = []

  if (config.profile.model) {
    lines.push(`model = \"${config.profile.model}\"`)
  }

  if (config.profile.approvalPolicy) {
    lines.push(`approval_policy = \"${config.profile.approvalPolicy}\"`)
  }

  if (config.profile.sandboxMode) {
    lines.push(`sandbox_mode = \"${config.profile.sandboxMode}\"`)
  }

  return {
    files: [
      {
        path: '.codex/config.toml',
        content: `${lines.join('\n')}\n`
      }
    ],
    warnings: []
  }
}
