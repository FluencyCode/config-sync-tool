import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('workspace metadata', () => {
  it('defines cli, build, and test scripts', () => {
    const pkg = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    )

    expect(pkg.type).toBe('module')
    expect(pkg.scripts.build).toBeTruthy()
    expect(pkg.scripts.test).toBeTruthy()
  })
})
