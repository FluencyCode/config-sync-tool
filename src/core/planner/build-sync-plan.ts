import type { ChangeItem, ManualAction, SkippedItem, WarningItem } from '../model/result.js'
import type { UnifiedConfigDiff } from '../diff/diff-config.js'
import { isWarningProfileKey, type ConflictMode } from './conflict-policy.js'

export interface SyncPlanStep {
  type: 'apply' | 'warn' | 'skip'
  message: string
}

export interface BuildSyncPlanInput {
  mode: ConflictMode
  diff: UnifiedConfigDiff
}

export interface SyncPlan {
  applied: ChangeItem[]
  warnings: WarningItem[]
  skipped: SkippedItem[]
  manualActions: ManualAction[]
  steps: SyncPlanStep[]
}

export function buildSyncPlan(input: BuildSyncPlanInput): SyncPlan {
  const applied: ChangeItem[] = []
  const warnings: WarningItem[] = []
  const skipped: SkippedItem[] = []
  const manualActions: ManualAction[] = []
  const steps: SyncPlanStep[] = []

  for (const change of input.diff.profileChanges) {
    if (isWarningProfileKey(change.key)) {
      warnings.push({
        code: 'PARTIAL_PROFILE_MAPPING',
        message: `Profile key ${change.key} requires partial mapping.`
      })
      steps.push({
        type: 'warn',
        message: `Review partial mapping for profile key ${change.key}.`
      })
      continue
    }

    applied.push({
      path: `profile.${change.key}`,
      action: 'update',
      detail: `Sync profile key ${change.key}`
    })
    steps.push({
      type: 'apply',
      message: `Apply profile key ${change.key}.`
    })
  }

  for (const change of input.diff.ruleChanges) {
    if (change.sourceRule.portable === false) {
      skipped.push({
        code: 'NON_PORTABLE_RULE',
        reason: `Rule ${change.id} is marked non-portable.`
      })
      manualActions.push({
        title: `Review rule ${change.id}`,
        description: 'Manually adapt this rule for the target platform.'
      })
      steps.push({
        type: 'skip',
        message: `Skip non-portable rule ${change.id}.`
      })
      continue
    }

    applied.push({
      path: `instructions.systemRules.${change.id}`,
      action: 'update',
      detail: `Sync rule ${change.id}`
    })
    steps.push({
      type: 'apply',
      message: `Apply rule ${change.id}.`
    })
  }

  for (const change of input.diff.skillChanges) {
    if (change.sourceSkill?.portability === 'manual') {
      skipped.push({
        code: 'MANUAL_SKILL_MAPPING',
        reason: `Skill ${change.name} requires manual mapping.`
      })
      manualActions.push({
        title: `Review skill ${change.name}`,
        description: 'Manually adapt this skill for the target platform.'
      })
      steps.push({
        type: 'skip',
        message: `Skip manual skill ${change.name}.`
      })
      continue
    }

    applied.push({
      path: `skills.${change.name}`,
      action: change.changeType === 'remove' ? 'delete' : 'update',
      detail: `Sync skill ${change.name}`
    })
    steps.push({
      type: 'apply',
      message: `Apply skill ${change.name}.`
    })
  }

  for (const change of input.diff.mcpChanges) {
    applied.push({
      path: `mcps.${change.name}`,
      action: change.changeType === 'remove' ? 'delete' : 'update',
      detail: `Sync MCP ${change.name}`
    })
    steps.push({
      type: 'apply',
      message: `Apply MCP ${change.name}.`
    })
  }

  for (const change of input.diff.hookChanges) {
    const hookKey = `${change.name}:${change.event}`

    if (change.sourceHook?.portability === 'manual') {
      skipped.push({
        code: 'MANUAL_HOOK_MAPPING',
        reason: `Hook ${change.name} (${change.event}) requires manual mapping.`,
        path: `hooks.${hookKey}`
      })
      manualActions.push({
        title: `Review hook ${change.name} (${change.event})`,
        description: 'Manually adapt this hook for the target platform.',
        path: `hooks.${hookKey}`
      })
      steps.push({
        type: 'skip',
        message: `Skip manual hook ${change.name} (${change.event}).`
      })
      continue
    }

    applied.push({
      path: `hooks.${hookKey}`,
      action: change.changeType === 'remove' ? 'delete' : 'update',
      detail: `Sync hook ${change.name} (${change.event})`
    })
    steps.push({
      type: 'apply',
      message: `Apply hook ${change.name} (${change.event}).`
    })
  }

  return {
    applied,
    warnings,
    skipped,
    manualActions,
    steps
  }
}
