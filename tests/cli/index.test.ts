import { afterEach, describe, expect, it, vi } from 'vitest'

const runDiffCommandMock = vi.fn()
const runSyncCommandMock = vi.fn()

vi.mock('../../src/cli/commands/diff.js', () => ({
  runDiffCommand: runDiffCommandMock
}))

vi.mock('../../src/cli/commands/sync.js', () => ({
  runSyncCommand: runSyncCommandMock
}))

vi.mock('../../src/cli/commands/scan.js', () => ({
  runScanCommand: vi.fn()
}))

vi.mock('../../src/cli/commands/doctor.js', () => ({
  runDoctorCommand: vi.fn()
}))

describe('buildCli', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    runDiffCommandMock.mockReset()
    runSyncCommandMock.mockReset()
  })

  it('prints skill mcp and hook diff sections in text mode', async () => {
    runDiffCommandMock.mockResolvedValue({
      mode: 'preview',
      diff: {
        profileChanges: [],
        ruleChanges: [],
        skillChanges: [
          { name: 'review', changeType: 'add' }
        ],
        mcpChanges: [
          { name: 'browser', changeType: 'update' }
        ],
        hookChanges: [
          { name: 'post-run', event: 'after-command', changeType: 'remove' }
        ]
      }
    })

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { buildCli } = await import('../../src/cli/index.js')

    await buildCli().parseAsync([
      'node',
      'config-sync',
      'diff',
      '--from',
      'claude',
      '--to',
      'codex',
      '--home-dir',
      '/tmp/home'
    ])

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[skills]'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('- add: review'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[mcps]'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('- update: browser'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[hooks]'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('- remove: post-run (after-command)'))
  })

  it('prints sync summary counts when new categories are present', async () => {
    runSyncCommandMock.mockResolvedValue({
      summary: {
        applied: 2,
        warnings: 1,
        skipped: 1
      },
      appliedFiles: ['/tmp/home/.codex/config.toml']
    })

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { buildCli } = await import('../../src/cli/index.js')

    await buildCli().parseAsync([
      'node',
      'config-sync',
      'sync',
      '--from',
      'claude',
      '--to',
      'codex',
      '--home-dir',
      '/tmp/home'
    ])

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('applied: 2'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('warnings: 1'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('skipped: 1'))
  })
})
