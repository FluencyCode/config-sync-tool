import { describe, expect, it } from 'vitest'
import { mapClaudeToUnified } from '../../src/adapters/claude/map-to-unified.js'

describe('mapClaudeToUnified', () => {
  it('maps settings and rules into unified config', async () => {
    const result = await mapClaudeToUnified({
      settings: {
        model: 'opus'
      },
      ruleFiles: [
        {
          path: 'fixtures/project/.claude/CLAUDE.md',
          content: '# project claude rules'
        }
      ],
      scope: 'project'
    })

    expect(result.profile.model).toBe('opus')
    expect(result.instructions.systemRules.length).toBeGreaterThan(0)
    expect(result.metadata.source).toBe('claude')
  })
})
