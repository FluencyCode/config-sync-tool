import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const rootDir = process.cwd()

describe('build config', () => {
  it('uses a dedicated tsconfig for production build output', async () => {
    const packageJson = JSON.parse(
      await readFile(join(rootDir, 'package.json'), 'utf-8')
    ) as {
      scripts: {
        build: string
      }
    }

    const tsconfigBuild = JSON.parse(
      await readFile(join(rootDir, 'tsconfig.build.json'), 'utf-8')
    ) as {
      include: string[]
      exclude?: string[]
    }

    expect(packageJson.scripts.build).toBe('tsc -p tsconfig.build.json')
    expect(tsconfigBuild.include).toEqual(['src/**/*.ts'])
    expect(tsconfigBuild.exclude ?? []).toContain('vitest.config.ts')
    expect(tsconfigBuild.exclude ?? []).toContain('tests')
  })
})
