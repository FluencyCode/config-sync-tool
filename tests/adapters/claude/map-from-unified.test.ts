import { describe, expect, it } from 'vitest'
import { createEmptyUnifiedConfig } from '../../../src/core/model/types.js'
import { mapUnifiedToClaude } from '../../../src/adapters/claude/map-from-unified.js'

describe('mapUnifiedToClaude', () => {
  it('writes supported skills mcps and hooks into claude settings', () => {
    const config = createEmptyUnifiedConfig('codex', 'user')
    config.profile.model = 'opus'
    config.skills.push({
      name: 'review',
      description: 'run code review',
      portability: 'portable'
    })
    config.mcps.push({
      name: 'browser',
      command: 'npx',
      args: ['@browser/mcp']
    })
    config.hooks.push({
      name: 'post-run',
      event: 'after-command',
      command: 'echo done',
      portability: 'portable'
    })

    const result = mapUnifiedToClaude(config)
    const settingsFile = result.files.find((file) => file.path === '.claude/settings.json')

    expect(settingsFile).toBeDefined()
    expect(JSON.parse(settingsFile!.content)).toEqual({
      model: 'opus',
      skills: [
        {
          name: 'review',
          description: 'run code review'
        }
      ],
      mcps: [
        {
          name: 'browser',
          command: 'npx',
          args: ['@browser/mcp']
        }
      ],
      hooks: [
        {
          name: 'post-run',
          event: 'after-command',
          command: 'echo done'
        }
      ]
    })
    expect(result.warnings).toEqual([])
  })

  it('warns when unified items contain unsupported claude-only output fields', () => {
    const config = createEmptyUnifiedConfig('codex', 'user')
    config.skills.push({
      name: 'review',
      description: 'run code review',
      entry: './skill.md',
      trigger: ['manual'],
      notes: ['internal'],
      portability: 'manual'
    })
    config.mcps.push({
      name: 'browser',
      command: 'npx',
      args: ['@browser/mcp'],
      env: { TOKEN: 'secret' },
      transport: 'stdio',
      enabled: false,
      scope: 'project'
    })
    config.hooks.push({
      name: 'post-run',
      event: 'after-command',
      command: 'echo done',
      enabled: false,
      portability: 'manual'
    })

    const result = mapUnifiedToClaude(config)

    expect(result.warnings).toEqual([
      'Claude skill review ignores entry during sync.',
      'Claude skill review ignores trigger during sync.',
      'Claude skill review ignores notes during sync.',
      'Claude skill review ignores portability during sync.',
      'Claude MCP browser ignores env during sync.',
      'Claude MCP browser ignores transport during sync.',
      'Claude MCP browser ignores enabled during sync.',
      'Claude MCP browser ignores scope during sync.',
      'Claude hook post-run (after-command) ignores enabled during sync.',
      'Claude hook post-run (after-command) ignores portability during sync.'
    ])
  })
})
