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

  return {
    applied,
    warnings,
    skipped,
    manualActions,
    steps
  }
}
