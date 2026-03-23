import { describe, expect, it } from 'vitest'
import { createEmptyUnifiedConfig } from '../../../src/core/model/types.js'
import { mapUnifiedToCodex } from '../../../src/adapters/codex/map-from-unified.js'
import { parseToml } from '../../../src/parsers/toml-parser.js'

describe('mapUnifiedToCodex', () => {
  it('writes supported skills mcps and hooks into codex config', () => {
    const config = createEmptyUnifiedConfig('claude', 'user')
    config.profile.model = 'gpt-5.2-codex'
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

    const result = mapUnifiedToCodex(config)
    const configFile = result.files.find((file) => file.path === '.codex/config.toml')

    expect(configFile).toBeDefined()
    expect(parseToml(configFile!.content)).toEqual({
      model: 'gpt-5.2-codex',
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

  it('warns when unified items contain unsupported codex output fields', () => {
    const config = createEmptyUnifiedConfig('claude', 'user')
    config.profile.reasoningEffort = 'high'
    config.profile.outputStyle = 'concise'
    config.profile.responseStorage = 'enabled'
    config.profile.env = { TOKEN: 'secret' }
    config.instructions.systemRules.push({
      id: 'rule-1',
      title: 'Rule 1',
      category: 'system',
      content: 'do not ship secrets'
    })
    config.agents.push({
      name: 'reviewer',
      portability: 'manual'
    })
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

    const result = mapUnifiedToCodex(config)

    expect(result.warnings).toEqual([
      'Codex profile ignores reasoningEffort during sync.',
      'Codex profile ignores outputStyle during sync.',
      'Codex profile ignores responseStorage during sync.',
      'Codex profile ignores env during sync.',
      'Codex sync ignores instructions during sync.',
      'Codex sync ignores agents during sync.',
      'Codex skill review ignores entry during sync.',
      'Codex skill review ignores trigger during sync.',
      'Codex skill review ignores notes during sync.',
      'Codex skill review ignores portability during sync.',
      'Codex MCP browser ignores env during sync.',
      'Codex MCP browser ignores transport during sync.',
      'Codex MCP browser ignores enabled during sync.',
      'Codex MCP browser ignores scope during sync.',
      'Codex hook post-run (after-command) ignores enabled during sync.',
      'Codex hook post-run (after-command) ignores portability during sync.'
    ])
  })

  it('escapes TOML control characters in written strings', () => {
    const config = createEmptyUnifiedConfig('claude', 'user')
    config.profile.model = 'gpt-5.2\tcodex'
    config.skills.push({
      name: 'review',
      description: 'line1\nline2',
      portability: 'portable'
    })

    const result = mapUnifiedToCodex(config)
    const configFile = result.files.find((file) => file.path === '.codex/config.toml')

    expect(configFile).toBeDefined()
    expect(parseToml(configFile!.content)).toEqual({
      model: 'gpt-5.2\tcodex',
      skills: [
        {
          name: 'review',
          description: 'line1\nline2'
        }
      ]
    })
  })
})
