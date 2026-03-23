import { describe, expect, it } from 'vitest'
import { mapCodexToUnified } from '../../../src/adapters/codex/map-to-unified.js'

describe('mapCodexToUnified', () => {
  it('maps codex hooks into unified config with only supported fields', async () => {
    const config = await mapCodexToUnified({
      config: {
        hooks: [
          {
            name: 'post-run',
            event: 'after-command',
            command: 'echo done',
            enabled: false
          }
        ]
      },
      scope: 'user',
      filePath: '.codex/config.toml'
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

  it('maps codex skills and mcps into unified config with only supported fields', async () => {
    const config = await mapCodexToUnified({
      config: {
        skills: [
          {
            name: 'review',
            description: 'run code review',
            trigger: ['manual']
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
      scope: 'user',
      filePath: '.codex/config.toml'
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

  it('drops unsupported or underspecified codex entries', async () => {
    const config = await mapCodexToUnified({
      config: {
        skills: ['review', { description: 'missing name' }],
        mcps: [
          { name: 'browser' },
          { name: 'bad-args', command: 'npx', args: [1, 2] }
        ],
        hooks: [
          { name: 'missing-event', command: 'echo done' },
          'post-run'
        ]
      },
      scope: 'user',
      filePath: '.codex/config.toml'
    })

    expect(config.skills).toEqual([])
    expect(config.mcps).toEqual([
      {
        name: 'browser'
      }
    ])
    expect(config.hooks).toEqual([])
  })
})
