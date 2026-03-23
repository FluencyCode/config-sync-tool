import { createBaseUnifiedConfig } from '../../core/normalize/unified-config.js'
import type {
  ConfigScope,
  HookItem,
  McpServerItem,
  SkillItem,
  UnifiedConfig
} from '../../core/model/types.js'

export interface MapCodexToUnifiedInput {
  config: Record<string, unknown>
  scope: ConfigScope
  filePath: string
}

function mapCodexSkill(input: Record<string, unknown>): SkillItem | null {
  if (typeof input.name !== 'string') {
    return null
  }

  return {
    name: input.name,
    description: typeof input.description === 'string' ? input.description : undefined,
    portability: 'portable'
  }
}

function mapCodexMcp(input: Record<string, unknown>): McpServerItem | null {
  if (typeof input.name !== 'string') {
    return null
  }

  if (
    input.args !== undefined
    && (!Array.isArray(input.args) || !input.args.every((item) => typeof item === 'string'))
  ) {
    return null
  }

  return {
    name: input.name,
    command: typeof input.command === 'string' ? input.command : undefined,
    args: Array.isArray(input.args) ? input.args : undefined
  }
}

function mapCodexHook(input: Record<string, unknown>): HookItem | null {
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

export async function mapCodexToUnified(
  input: MapCodexToUnifiedInput
): Promise<UnifiedConfig> {
  const config = createBaseUnifiedConfig('codex', input.scope, [input.filePath])

  if (typeof input.config.model === 'string') {
    config.profile.model = input.config.model
  }

  if (typeof input.config.approval_policy === 'string') {
    config.profile.approvalPolicy = input.config.approval_policy
  }

  if (typeof input.config.sandbox_mode === 'string') {
    config.profile.sandboxMode = input.config.sandbox_mode
  }

  if (Array.isArray(input.config.skills)) {
    config.skills = input.config.skills.flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return []
      }

      const skill = mapCodexSkill(item as Record<string, unknown>)
      return skill ? [skill] : []
    })
  }

  if (Array.isArray(input.config.mcps)) {
    config.mcps = input.config.mcps.flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return []
      }

      const mcp = mapCodexMcp(item as Record<string, unknown>)
      return mcp ? [mcp] : []
    })
  }

  if (Array.isArray(input.config.hooks)) {
    config.hooks = input.config.hooks.flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return []
      }

      const hook = mapCodexHook(item as Record<string, unknown>)
      return hook ? [hook] : []
    })
  }

  return config
}
