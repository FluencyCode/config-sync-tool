import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { applySyncPlan } from '../../src/core/planner/apply-sync-plan.js'

describe('applySyncPlan', () => {
  it('writes backups before applying file changes', async () => {
    const targetPath = 'tests/core/runtime/target.toml'
    const result = await applySyncPlan({
      dryRun: false,
      steps: [
        {
          path: targetPath,
          content: 'updated=true\n'
        }
      ]
    })

    expect(result.backupsCreated.length).toBe(1)
    expect(result.applied.length).toBe(1)
    expect(readFileSync(targetPath, 'utf8')).toBe('updated=true\n')
  })

  it('creates missing target files without requiring a backup source file', async () => {
    const targetPath = path.join('tests/core/runtime/generated', 'created.toml')
    rmSync(path.dirname(targetPath), { recursive: true, force: true })
    mkdirSync(path.dirname(targetPath), { recursive: true })

    const result = await applySyncPlan({
      dryRun: false,
      steps: [
        {
          path: targetPath,
          content: 'created=true\n'
        }
      ]
    })

    expect(result.backupsCreated).toEqual([])
    expect(result.applied.length).toBe(1)
    expect(existsSync(targetPath)).toBe(true)
    expect(readFileSync(targetPath, 'utf8')).toBe('created=true\n')
  })
})
