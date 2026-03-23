export type ConfigSource = 'claude' | 'codex'
export type ConfigScope = 'user' | 'project'
export type RuleCategory = 'system' | 'output' | 'safety' | 'language' | 'project'
export type AgentMode = 'serial' | 'parallel'
export type AgentPortability = 'native' | 'template' | 'manual'
export type SkillPortability = 'native' | 'portable' | 'manual'
export type HookPortability = 'portable' | 'manual'
export type TransportType = 'stdio' | 'http' | 'sse' | 'unknown'

export interface RuleItem {
  id: string
  title: string
  category: RuleCategory
  content: string
  priority?: number
  portable?: boolean
}

export interface SkillItem {
  name: string
  description?: string
  trigger?: string[]
  entry?: string
  portability: SkillPortability
  notes?: string[]
}

export interface AgentItem {
  name: string
  role?: string
  trigger?: string[]
  tools?: string[]
  mode?: AgentMode
  portability: AgentPortability
}

export interface McpServerItem {
  name: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  transport?: TransportType
  enabled?: boolean
  scope?: ConfigScope
}

export interface HookItem {
  name: string
  event: string
  command: string
  enabled?: boolean
  portability: HookPortability
}

export interface UnifiedConfig {
  profile: {
    model?: string
    approvalPolicy?: string
    sandboxMode?: string
    reasoningEffort?: string
    outputStyle?: string
    responseStorage?: 'enabled' | 'disabled'
    env?: Record<string, string>
  }
  instructions: {
    systemRules: RuleItem[]
    outputRules: RuleItem[]
    safetyRules: RuleItem[]
    projectRules: RuleItem[]
  }
  skills: SkillItem[]
  agents: AgentItem[]
  mcps: McpServerItem[]
  hooks: HookItem[]
  metadata: {
    source: ConfigSource
    scope: ConfigScope
    files: string[]
  }
}

export function createEmptyUnifiedConfig(
  source: ConfigSource,
  scope: ConfigScope
): UnifiedConfig {
  return {
    profile: {},
    instructions: {
      systemRules: [],
      outputRules: [],
      safetyRules: [],
      projectRules: []
    },
    skills: [],
    agents: [],
    mcps: [],
    hooks: [],
    metadata: {
      source,
      scope,
      files: []
    }
  }
}
