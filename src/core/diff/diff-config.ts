import type { HookItem, McpServerItem, RuleItem, SkillItem, UnifiedConfig } from '../model/types.js'

export interface ProfileChange {
  key: string
  sourceValue: unknown
  targetValue: unknown
}

export interface RuleChange {
  id: string
  sourceRule: RuleItem
  targetRule?: RuleItem
}

export interface SkillChange {
  name: string
  changeType: 'add' | 'remove' | 'update'
  sourceSkill?: SkillItem
  targetSkill?: SkillItem
}

export interface McpChange {
  name: string
  changeType: 'add' | 'remove' | 'update'
  sourceMcp?: McpServerItem
  targetMcp?: McpServerItem
}

export interface HookChange {
  name: string
  event: string
  changeType: 'add' | 'remove' | 'update'
  sourceHook?: HookItem
  targetHook?: HookItem
}

export interface UnifiedConfigDiff {
  profileChanges: ProfileChange[]
  ruleChanges: RuleChange[]
  skillChanges: SkillChange[]
  mcpChanges: McpChange[]
  hookChanges: HookChange[]
}

const PROFILE_KEYS: Array<keyof UnifiedConfig['profile']> = [
  'model',
  'approvalPolicy',
  'sandboxMode',
  'reasoningEffort',
  'outputStyle',
  'responseStorage'
]

function areStringArraysEqual(source?: string[], target?: string[]): boolean {
  if (source === undefined && target === undefined) {
    return true
  }

  if (source === undefined || target === undefined || source.length !== target.length) {
    return false
  }

  return source.every((value, index) => value === target[index])
}

function areStringRecordsEqual(
  source?: Record<string, string>,
  target?: Record<string, string>
): boolean {
  if (source === undefined && target === undefined) {
    return true
  }

  if (source === undefined || target === undefined) {
    return false
  }

  const sourceKeys = Object.keys(source)
  const targetKeys = Object.keys(target)

  if (sourceKeys.length !== targetKeys.length) {
    return false
  }

  return sourceKeys.every((key) => source[key] === target[key])
}

function areSkillsEqual(source: SkillItem, target: SkillItem): boolean {
  return source.name === target.name
    && source.description === target.description
    && source.entry === target.entry
    && source.portability === target.portability
    && areStringArraysEqual(source.trigger, target.trigger)
    && areStringArraysEqual(source.notes, target.notes)
}

function areMcpsEqual(source: McpServerItem, target: McpServerItem): boolean {
  return source.name === target.name
    && source.command === target.command
    && source.transport === target.transport
    && source.enabled === target.enabled
    && source.scope === target.scope
    && areStringArraysEqual(source.args, target.args)
    && areStringRecordsEqual(source.env, target.env)
}

function areHooksEqual(source: HookItem, target: HookItem): boolean {
  return source.name === target.name
    && source.event === target.event
    && source.command === target.command
    && source.enabled === target.enabled
    && source.portability === target.portability
}

export function diffUnifiedConfig(
  source: UnifiedConfig,
  target: UnifiedConfig
): UnifiedConfigDiff {
  const profileChanges = PROFILE_KEYS.flatMap((key) => {
    const sourceValue = source.profile[key]
    const targetValue = target.profile[key]

    if (sourceValue === undefined && targetValue === undefined) {
      return []
    }

    if (sourceValue === targetValue) {
      return []
    }

    return [{
      key,
      sourceValue,
      targetValue
    }]
  })

  const targetRuleMap = new Map(
    target.instructions.systemRules.map((rule) => [rule.id, rule])
  )

  const ruleChanges = source.instructions.systemRules.flatMap((rule) => {
    const targetRule = targetRuleMap.get(rule.id)

    if (!targetRule) {
      return [{
        id: rule.id,
        sourceRule: rule
      }]
    }

    if (targetRule.content !== rule.content) {
      return [{
        id: rule.id,
        sourceRule: rule,
        targetRule
      }]
    }

    return []
  })

  const sourceSkillMap = new Map(source.skills.map((skill) => [skill.name, skill]))
  const targetSkillMap = new Map(target.skills.map((skill) => [skill.name, skill]))
  const skillChanges: SkillChange[] = [
    ...source.skills.flatMap((skill): SkillChange[] => {
      const targetSkill = targetSkillMap.get(skill.name)

      if (!targetSkill) {
        return [{
          name: skill.name,
          changeType: 'add',
          sourceSkill: skill
        }]
      }

      if (!areSkillsEqual(skill, targetSkill)) {
        return [{
          name: skill.name,
          changeType: 'update',
          sourceSkill: skill,
          targetSkill
        }]
      }

      return []
    }),
    ...target.skills.flatMap((skill): SkillChange[] => {
      if (sourceSkillMap.has(skill.name)) {
        return []
      }

      return [{
        name: skill.name,
        changeType: 'remove',
        targetSkill: skill
      }]
    })
  ]

  const sourceMcpMap = new Map(source.mcps.map((mcp) => [mcp.name, mcp]))
  const targetMcpMap = new Map(target.mcps.map((mcp) => [mcp.name, mcp]))
  const mcpChanges: McpChange[] = [
    ...source.mcps.flatMap((mcp): McpChange[] => {
      const targetMcp = targetMcpMap.get(mcp.name)

      if (!targetMcp) {
        return [{
          name: mcp.name,
          changeType: 'add',
          sourceMcp: mcp
        }]
      }

      if (!areMcpsEqual(mcp, targetMcp)) {
        return [{
          name: mcp.name,
          changeType: 'update',
          sourceMcp: mcp,
          targetMcp
        }]
      }

      return []
    }),
    ...target.mcps.flatMap((mcp): McpChange[] => {
      if (sourceMcpMap.has(mcp.name)) {
        return []
      }

      return [{
        name: mcp.name,
        changeType: 'remove',
        targetMcp: mcp
      }]
    })
  ]

  const getHookKey = (hook: HookItem) => `${hook.name}:${hook.event}`
  const sourceHookMap = new Map(source.hooks.map((hook) => [getHookKey(hook), hook]))
  const targetHookMap = new Map(target.hooks.map((hook) => [getHookKey(hook), hook]))
  const hookChanges: HookChange[] = [
    ...source.hooks.flatMap((hook): HookChange[] => {
      const targetHook = targetHookMap.get(getHookKey(hook))

      if (!targetHook) {
        return [{
          name: hook.name,
          event: hook.event,
          changeType: 'add',
          sourceHook: hook
        }]
      }

      if (!areHooksEqual(hook, targetHook)) {
        return [{
          name: hook.name,
          event: hook.event,
          changeType: 'update',
          sourceHook: hook,
          targetHook
        }]
      }

      return []
    }),
    ...target.hooks.flatMap((hook): HookChange[] => {
      if (sourceHookMap.has(getHookKey(hook))) {
        return []
      }

      return [{
        name: hook.name,
        event: hook.event,
        changeType: 'remove',
        targetHook: hook
      }]
    })
  ]

  return {
    profileChanges,
    ruleChanges,
    skillChanges,
    mcpChanges,
    hookChanges
  }
}
