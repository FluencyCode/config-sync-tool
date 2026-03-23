import { describe, expect, it } from 'vitest'
import { createEmptyUnifiedConfig } from '../../src/core/model/types.js'

describe('createEmptyUnifiedConfig', () => {
  it('builds the expected empty structure', () => {
    expect(createEmptyUnifiedConfig('claude', 'project')).toMatchObject({
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
      hooks: []
    })
  })
})
