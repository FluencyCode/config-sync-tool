import { copyFile, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { runSyncCommand } from '../../src/cli/commands/sync.js'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('runSyncCommand', () => {
  it('returns a dry-run sync summary', async () => {
    const result = await runSyncCommand({
      from: 'claude',
      to: 'codex',
      dryRun: true,
      projectDir: 'fixtures/project',
      homeDir: 'fixtures/home'
    })

    expect(result.summary).toBeTruthy()
  })

  it('writes target files when syncing from codex to claude', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'config-sync-'))
    tempDirs.push(dir)

    const homeDir = path.join(dir, 'home')
    const projectDir = path.join(dir, 'project')

    await mkdir(path.join(homeDir, '.codex'), { recursive: true })
    await mkdir(path.join(homeDir, '.claude'), { recursive: true })
    await mkdir(path.join(projectDir, '.claude'), { recursive: true })

    await copyFile('fixtures/home/.codex/config.toml', path.join(homeDir, '.codex', 'config.toml'))
    await copyFile('fixtures/home/.claude/settings.json', path.join(homeDir, '.claude', 'settings.json'))
    await copyFile('fixtures/project/.claude/CLAUDE.md', path.join(projectDir, '.claude', 'CLAUDE.md'))

    await runSyncCommand({
      from: 'codex',
      to: 'claude',
      dryRun: false,
      projectDir,
      homeDir
    })

    const claudeSettings = await readFile(path.join(homeDir, '.claude', 'settings.json'), 'utf8')
    expect(claudeSettings).toContain('gpt-5.2-codex')
  })
})
