import { describe, expect, it } from 'vitest'
import { loadStructuredFile } from '../../src/parsers/file-loader.js'

describe('loadStructuredFile', () => {
  it('dispatches by extension', async () => {
    const result = await loadStructuredFile('fixtures/codex/sample-config.toml')

    expect(result.format).toBe('toml')
    expect(result.data).toBeTruthy()
  })
})
