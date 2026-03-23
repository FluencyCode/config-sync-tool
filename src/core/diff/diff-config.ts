import type { RuleItem, UnifiedConfig } from '../model/types.js'

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

export interface UnifiedConfigDiff {
  profileChanges: ProfileChange[]
  ruleChanges: RuleChange[]
}

const PROFILE_KEYS: Array<keyof UnifiedConfig['profile']> = [
  'model',
  'approvalPolicy',
  'sandboxMode',
  'reasoningEffort',
  'outputStyle',
  'responseStorage'
]

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

  return {
    profileChanges,
    ruleChanges
  }
}
