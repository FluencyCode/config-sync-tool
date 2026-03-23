import { describe, expect, it } from 'vitest'
import { runDiffCommand } from '../../src/cli/commands/diff.js'

describe('runDiffCommand', () => {
  it('returns a preview without applying changes in dry-run mode', async () => {
    const result = await runDiffCommand({
      from: 'claude',
      to: 'codex',
      dryRun: true,
      projectDir: 'fixtures/project',
      homeDir: 'fixtures/home'
    })

    expect(result.mode).toBe('preview')
  })

  it('uses the provided homeDir for claude settings instead of project-relative fixtures', async () => {
    await expect(runDiffCommand({
      from: 'claude',
      to: 'codex',
      dryRun: true,
      projectDir: 'fixtures/project',
      homeDir: 'fixtures/codex'
    })).rejects.toThrow(/fixtures[\\/]codex[\\/]\.claude[\\/]settings\.json/)
  })
})
