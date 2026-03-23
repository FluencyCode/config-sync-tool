import { describe, expect, it } from 'vitest'
import { scanSources } from '../../src/parsers/scan-sources.js'

describe('scanSources', () => {
  it('finds claude and codex source groups from roots', async () => {
    const result = await scanSources({
      homeDir: 'fixtures/home',
      projectDir: 'fixtures/project'
    })

    expect(result.claude.length).toBeGreaterThan(0)
    expect(result.codex.length).toBeGreaterThan(0)
  })
})
