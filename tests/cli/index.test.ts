import { CommanderError } from 'commander'
import { describe, expect, it, vi } from 'vitest'
import { buildCli, parseTool, validateToolPair } from '../../src/cli/index.js'
import * as scanModule from '../../src/cli/commands/scan.js'
import * as diffModule from '../../src/cli/commands/diff.js'
import * as syncModule from '../../src/cli/commands/sync.js'

describe('buildCli', () => {
  it('registers scan diff sync doctor commands', () => {
    const cli = buildCli()

    expect(cli.commands.map((item) => item.name())).toEqual([
      'scan',
      'diff',
      'sync',
      'doctor'
    ])
  })

  it('passes cli options to scan handler', async () => {
    const cli = buildCli()
    const spy = vi.spyOn(scanModule, 'runScanCommand').mockResolvedValue({
      sources: []
    })

    await cli.parseAsync([
      'scan',
      '--home-dir',
      '/tmp/home',
      '--project-dir',
      '/tmp/project'
    ], { from: 'user' })

    expect(spy).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith({
      homeDir: '/tmp/home',
      projectDir: '/tmp/project'
    })
  })

  it('passes cli options to diff handler', async () => {
    const cli = buildCli()
    const spy = vi.spyOn(diffModule, 'runDiffCommand').mockResolvedValue({
      mode: 'preview',
      diff: {
        profileChanges: [],
        ruleChanges: []
      }
    })

    await cli.parseAsync([
      'diff',
      '--from',
      'codex',
      '--to',
      'claude',
      '--home-dir',
      '/tmp/home',
      '--project-dir',
      '/tmp/project'
    ], { from: 'user' })

    expect(spy).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith({
      from: 'codex',
      to: 'claude',
      dryRun: true,
      homeDir: '/tmp/home',
      projectDir: '/tmp/project'
    })
  })

  it('passes cli options to sync handler', async () => {
    const cli = buildCli()
    const spy = vi.spyOn(syncModule, 'runSyncCommand').mockResolvedValue({
      summary: {
        applied: 1,
        warnings: 0,
        skipped: 0
      }
    })

    await cli.parseAsync([
      'sync',
      '--from',
      'claude',
      '--to',
      'codex',
      '--home-dir',
      '/tmp/home',
      '--project-dir',
      '/tmp/project',
      '--write'
    ], { from: 'user' })

    expect(spy).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith({
      from: 'claude',
      to: 'codex',
      dryRun: false,
      homeDir: '/tmp/home',
      projectDir: '/tmp/project'
    })
  })

  it('rejects identical source and target tools', () => {
    expect(() => validateToolPair('claude', 'claude')).toThrow('from and to must be different tools')
  })

  it('rejects unsupported tool values', () => {
    expect(() => parseTool('invalid')).toThrowError(CommanderError)
    expect(() => parseTool('invalid')).toThrow('tool must be one of: claude, codex')
  })
})
