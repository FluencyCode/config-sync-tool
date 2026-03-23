import { describe, expect, it } from 'vitest'
import { buildSyncPlan } from '../../../src/core/planner/build-sync-plan.js'

describe('buildSyncPlan', () => {
  it('plans portable skill changes as applied', () => {
    const plan = buildSyncPlan({
      mode: 'loose',
      diff: {
        profileChanges: [],
        ruleChanges: [],
        skillChanges: [
          {
            name: 'review',
            changeType: 'add',
            sourceSkill: {
              name: 'review',
              portability: 'portable'
            }
          }
        ],
        mcpChanges: [],
        hookChanges: []
      }
    })

    expect(plan.applied).toEqual([
      expect.objectContaining({ path: 'skills.review' })
    ])
  })

  it('plans manual skill changes as skipped', () => {
    const plan = buildSyncPlan({
      mode: 'loose',
      diff: {
        profileChanges: [],
        ruleChanges: [],
        skillChanges: [
          {
            name: 'dangerous',
            changeType: 'add',
            sourceSkill: {
              name: 'dangerous',
              portability: 'manual'
            }
          }
        ],
        mcpChanges: [],
        hookChanges: []
      }
    })

    expect(plan.skipped).toEqual([
      expect.objectContaining({ code: 'MANUAL_SKILL_MAPPING' })
    ])
  })

  it('plans manual hook changes as skipped', () => {
    const plan = buildSyncPlan({
      mode: 'loose',
      diff: {
        profileChanges: [],
        ruleChanges: [],
        skillChanges: [],
        mcpChanges: [],
        hookChanges: [
          {
            name: 'post-run',
            event: 'after-command',
            changeType: 'add',
            sourceHook: {
              name: 'post-run',
              event: 'after-command',
              command: 'echo done',
              portability: 'manual'
            }
          }
        ]
      }
    })

    expect(plan.skipped).toEqual([
      expect.objectContaining({ code: 'MANUAL_HOOK_MAPPING' })
    ])
  })

  it('keeps hook event in applied path', () => {
    const plan = buildSyncPlan({
      mode: 'loose',
      diff: {
        profileChanges: [],
        ruleChanges: [],
        skillChanges: [],
        mcpChanges: [],
        hookChanges: [
          {
            name: 'post-run',
            event: 'after-command',
            changeType: 'add',
            sourceHook: {
              name: 'post-run',
              event: 'after-command',
              command: 'echo done',
              portability: 'portable'
            }
          }
        ]
      }
    })

    expect(plan.applied).toEqual([
      expect.objectContaining({ path: 'hooks.post-run:after-command' })
    ])
  })

  it('keeps warning profile keys in warnings', () => {
    const plan = buildSyncPlan({
      mode: 'loose',
      diff: {
        profileChanges: [
          {
            key: 'outputStyle',
            sourceValue: 'concise',
            targetValue: 'verbose'
          }
        ],
        ruleChanges: [],
        skillChanges: [],
        mcpChanges: [],
        hookChanges: []
      }
    })

    expect(plan.warnings).toEqual([
      expect.objectContaining({ code: 'PARTIAL_PROFILE_MAPPING' })
    ])
    expect(plan.steps).toEqual([
      expect.objectContaining({ type: 'warn' })
    ])
  })
})
