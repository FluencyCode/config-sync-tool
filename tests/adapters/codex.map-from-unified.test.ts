import { describe, expect, it } from 'vitest'
import { mapUnifiedToCodex } from '../../src/adapters/codex/map-from-unified.js'
import { createEmptyUnifiedConfig } from '../../src/core/model/types.js'

describe('mapUnifiedToCodex', () => {
  it('creates target patches for supported MVP fields', () => {
    const unifiedConfig = createEmptyUnifiedConfig('codex', 'user')
    unifiedConfig.profile.model = 'gpt-5.2-codex'
    unifiedConfig.profile.approvalPolicy = 'on-request'

    const result = mapUnifiedToCodex(unifiedConfig)

    expect(result.files.length).toBeGreaterThan(0)
  })
})
