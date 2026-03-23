import { describe, expect, it } from 'vitest'
import { mapCodexToUnified } from '../../src/adapters/codex/map-to-unified.js'

describe('mapCodexToUnified', () => {
  it('maps root config into unified config', async () => {
    const result = await mapCodexToUnified({
      config: {
        model: 'gpt-5.2-codex',
        approval_policy: 'on-request',
        sandbox_mode: 'workspace-write'
      },
      scope: 'user',
      filePath: 'fixtures/home/.codex/config.toml'
    })

    expect(result.profile.approvalPolicy).toBe('on-request')
    expect(result.profile.sandboxMode).toBe('workspace-write')
    expect(result.metadata.source).toBe('codex')
  })
})
