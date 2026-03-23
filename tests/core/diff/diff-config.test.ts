import { describe, expect, it } from 'vitest'
import { createEmptyUnifiedConfig } from '../../../src/core/model/types.js'
import { diffUnifiedConfig } from '../../../src/core/diff/diff-config.js'

describe('diffUnifiedConfig', () => {
  it('detects skill updates', () => {
    const source = createEmptyUnifiedConfig('claude', 'user')
    source.skills.push({
      name: 'review',
      description: 'old',
      portability: 'portable'
    })

    const target = createEmptyUnifiedConfig('codex', 'user')
    target.skills.push({
      name: 'review',
      description: 'new',
      portability: 'portable'
    })

    const diff = diffUnifiedConfig(source, target)

    expect(diff.skillChanges).toEqual([
      expect.objectContaining({
        name: 'review',
        changeType: 'update',
        sourceSkill: expect.objectContaining({ description: 'old' }),
        targetSkill: expect.objectContaining({ description: 'new' })
      })
    ])
  })

  it('does not report mcp updates when env key order differs only', () => {
    const source = createEmptyUnifiedConfig('claude', 'user')
    source.mcps.push({
      name: 'browser',
      env: {
        A: '1',
        B: '2'
      }
    })

    const target = createEmptyUnifiedConfig('codex', 'user')
    target.mcps.push({
      name: 'browser',
      env: {
        B: '2',
        A: '1'
      }
    })

    const diff = diffUnifiedConfig(source, target)

    expect(diff.mcpChanges).toEqual([])
  })

  it('detects mcp updates', () => {
    const source = createEmptyUnifiedConfig('claude', 'user')
    source.mcps.push({ name: 'browser', enabled: true })

    const target = createEmptyUnifiedConfig('codex', 'user')
    target.mcps.push({ name: 'browser', enabled: false })

    const diff = diffUnifiedConfig(source, target)

    expect(diff.mcpChanges).toEqual([
      expect.objectContaining({
        name: 'browser',
        changeType: 'update',
        sourceMcp: expect.objectContaining({ enabled: true }),
        targetMcp: expect.objectContaining({ enabled: false })
      })
    ])
  })

  it('detects hook additions', () => {
    const source = createEmptyUnifiedConfig('claude', 'user')
    source.hooks.push({
      name: 'post-run',
      event: 'after-command',
      command: 'echo done',
      portability: 'portable'
    })

    const target = createEmptyUnifiedConfig('codex', 'user')

    const diff = diffUnifiedConfig(source, target)
    const [change] = diff.hookChanges

    expect(change).toMatchObject({
      name: 'post-run',
      event: 'after-command',
      changeType: 'add',
      sourceHook: expect.objectContaining({ command: 'echo done' })
    })
    expect(change.targetHook).toBeUndefined()
  })

  it('detects hook removals', () => {
    const source = createEmptyUnifiedConfig('claude', 'user')

    const target = createEmptyUnifiedConfig('codex', 'user')
    target.hooks.push({
      name: 'post-run',
      event: 'after-command',
      command: 'echo done',
      portability: 'portable'
    })

    const diff = diffUnifiedConfig(source, target)
    const [change] = diff.hookChanges

    expect(change).toMatchObject({
      name: 'post-run',
      event: 'after-command',
      changeType: 'remove',
      targetHook: expect.objectContaining({ command: 'echo done' })
    })
    expect(change.sourceHook).toBeUndefined()
  })
})
