import { createBaseUnifiedConfig } from '../../core/normalize/unified-config.js'
import type { ConfigScope, UnifiedConfig } from '../../core/model/types.js'

export interface ClaudeRuleFile {
  path: string
  content: string
}

export interface MapClaudeToUnifiedInput {
  settings: Record<string, unknown>
  ruleFiles: ClaudeRuleFile[]
  scope: ConfigScope
}

export async function mapClaudeToUnified(
  input: MapClaudeToUnifiedInput
): Promise<UnifiedConfig> {
  const files = input.ruleFiles.map((item) => item.path)
  const config = createBaseUnifiedConfig('claude', input.scope, files)

  if (typeof input.settings.model === 'string') {
    config.profile.model = input.settings.model
  }

  for (const ruleFile of input.ruleFiles) {
    config.instructions.systemRules.push({
      id: ruleFile.path,
      title: ruleFile.path.split(/[\\/]/).pop() ?? ruleFile.path,
      category: 'system',
      content: ruleFile.content,
      portable: true
    })
  }

  return config
}
