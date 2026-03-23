import { createBaseUnifiedConfig } from '../../core/normalize/unified-config.js'
import type {
  ConfigScope,
  HookItem,
  McpServerItem,
  SkillItem,
  UnifiedConfig
} from '../../core/model/types.js'

export interface ClaudeRuleFile {
  path: string
  content: string
}

export interface MapClaudeToUnifiedInput {
  settings: Record<string, unknown>
  ruleFiles: ClaudeRuleFile[]
  scope: ConfigScope
}

function mapClaudeSkill(input: Record<string, unknown>): SkillItem | null {
  if (typeof input.name !== 'string') {
    return null
  }

  return {
    name: input.name,
    description: typeof input.description === 'string' ? input.description : undefined,
    portability: 'portable'
  }
}

function mapClaudeMcp(input: Record<string, unknown>): McpServerItem | null {
  if (typeof input.name !== 'string') {
    return null
  }

  return {
    name: input.name,
    command: typeof input.command === 'string' ? input.command : undefined,
    args: Array.isArray(input.args) && input.args.every((item) => typeof item === 'string')
      ? input.args
      : undefined
  }
}

function mapClaudeHook(input: Record<string, unknown>): HookItem | null {
  if (
    typeof input.name !== 'string'
    || typeof input.event !== 'string'
    || typeof input.command !== 'string'
  ) {
    return null
  }

  return {
    name: input.name,
    event: input.event,
    command: input.command,
    portability: 'portable'
  }
}

export async function mapClaudeToUnified(
  input: MapClaudeToUnifiedInput
): Promise<UnifiedConfig> {
  const files = input.ruleFiles.map((item) => item.path)
  const config = createBaseUnifiedConfig('claude', input.scope, files)

  if (typeof input.settings.model === 'string') {
    config.profile.model = input.settings.model
  }

  if (Array.isArray(input.settings.skills)) {
    config.skills = input.settings.skills.flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return []
      }

      const skill = mapClaudeSkill(item as Record<string, unknown>)
      return skill ? [skill] : []
    })
  }

  if (Array.isArray(input.settings.mcps)) {
    config.mcps = input.settings.mcps.flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return []
      }

      const mcp = mapClaudeMcp(item as Record<string, unknown>)
      return mcp ? [mcp] : []
    })
  }

  if (Array.isArray(input.settings.hooks)) {
    config.hooks = input.settings.hooks.flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return []
      }

      const hook = mapClaudeHook(item as Record<string, unknown>)
      return hook ? [hook] : []
    })
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
