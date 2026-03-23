import { describe, expect, it } from 'vitest'
import { mapClaudeToUnified } from '../../../src/adapters/claude/map-to-unified.js'

describe('mapClaudeToUnified', () => {
  it('maps claude hooks into unified config with only supported fields', async () => {
    const config = await mapClaudeToUnified({
      settings: {
        hooks: [
          {
            name: 'post-run',
            event: 'after-command',
            command: 'echo done',
            timeout: 30
          }
        ]
      },
      ruleFiles: [],
      scope: 'user'
    })

    expect(config.hooks).toEqual([
      {
        name: 'post-run',
        event: 'after-command',
        command: 'echo done',
        portability: 'portable'
      }
    ])
  })

  it('maps claude skills and mcps into unified config with only supported fields', async () => {
    const config = await mapClaudeToUnified({
      settings: {
        skills: [
          {
            name: 'review',
            description: 'run code review',
            entry: './skill.md'
          }
        ],
        mcps: [
          {
            name: 'browser',
            command: 'npx',
            args: ['@browser/mcp'],
            env: { TOKEN: 'secret' }
          }
        ]
      },
      ruleFiles: [],
      scope: 'user'
    })

    expect(config.skills).toEqual([
      {
        name: 'review',
        description: 'run code review',
        portability: 'portable'
      }
    ])
    expect(config.mcps).toEqual([
      {
        name: 'browser',
        command: 'npx',
        args: ['@browser/mcp']
      }
    ])
  })
})
