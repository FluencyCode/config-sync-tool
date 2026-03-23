import { describe, expect, it } from 'vitest'
import { diffUnifiedConfig } from '../../src/core/diff/diff-config.js'
import { createEmptyUnifiedConfig } from '../../src/core/model/types.js'

describe('diffUnifiedConfig', () => {
  it('reports profile and rules differences', () => {
    const sourceConfig = createEmptyUnifiedConfig('claude', 'project')
    sourceConfig.profile.model = 'opus'
    sourceConfig.instructions.systemRules.push({
      id: 'rule-1',
      title: 'rule-1',
      category: 'system',
      content: 'allow read',
      portable: true
    })

    const targetConfig = createEmptyUnifiedConfig('codex', 'project')

    const diff = diffUnifiedConfig(sourceConfig, targetConfig)

    expect(diff.profileChanges.length).toBe(1)
    expect(diff.ruleChanges.length).toBe(1)
  })
})
