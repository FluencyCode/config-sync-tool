import { describe, expect, it } from 'vitest'
import { mapUnifiedToClaude } from '../../src/adapters/claude/map-from-unified.js'
import { createEmptyUnifiedConfig } from '../../src/core/model/types.js'

describe('mapUnifiedToClaude', () => {
  it('creates target patches for supported MVP fields', () => {
    const unifiedConfig = createEmptyUnifiedConfig('claude', 'project')
    unifiedConfig.profile.model = 'opus'
    unifiedConfig.instructions.systemRules.push({
      id: 'rule-1',
      title: 'rule-1',
      category: 'system',
      content: 'strict output',
      portable: true
    })

    const result = mapUnifiedToClaude(unifiedConfig)

    expect(result.files.length).toBeGreaterThan(0)
  })
})
