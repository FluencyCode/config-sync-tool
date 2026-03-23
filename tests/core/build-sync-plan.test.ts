import { describe, expect, it } from 'vitest'
import { buildSyncPlan } from '../../src/core/planner/build-sync-plan.js'

describe('buildSyncPlan', () => {
  it('creates applied, warning, skipped, and manual action buckets', () => {
    const plan = buildSyncPlan({
      mode: 'loose',
      diff: {
        profileChanges: [
          {
            key: 'model',
            sourceValue: 'opus',
            targetValue: undefined
          },
          {
            key: 'outputStyle',
            sourceValue: 'abyss-cultivator',
            targetValue: undefined
          }
        ],
        ruleChanges: [
          {
            id: 'rule-1',
            sourceRule: {
              id: 'rule-1',
              title: 'rule-1',
              category: 'system',
              content: 'strict output',
              portable: false
            }
          }
        ]
      }
    })

    expect(plan.warnings.length).toBeGreaterThan(0)
    expect(plan.steps.length).toBeGreaterThan(0)
    expect(plan.applied.length).toBe(1)
    expect(plan.skipped.length).toBe(1)
  })
})
