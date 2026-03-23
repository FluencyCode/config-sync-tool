import { describe, expect, it } from 'vitest'
import { runScanCommand } from '../../src/cli/commands/scan.js'

describe('runScanCommand', () => {
  it('returns discovered source summaries', async () => {
    const result = await runScanCommand({
      projectDir: 'fixtures/project',
      homeDir: 'fixtures/home'
    })

    expect(result.sources.length).toBeGreaterThan(0)
  })
})
