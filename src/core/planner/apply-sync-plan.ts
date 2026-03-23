import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

export interface ApplySyncStep {
  path: string
  content: string
}

export interface ApplySyncPlanInput {
  dryRun: boolean
  steps: ApplySyncStep[]
}

export interface ApplySyncPlanResult {
  backupsCreated: string[]
  applied: string[]
}

export async function applySyncPlan(
  input: ApplySyncPlanInput
): Promise<ApplySyncPlanResult> {
  const backupsCreated: string[] = []
  const applied: string[] = []

  if (input.dryRun) {
    return {
      backupsCreated,
      applied
    }
  }

  for (const step of input.steps) {
    const absolutePath = path.resolve(step.path)
    const backupPath = `${absolutePath}.bak`

    await mkdir(path.dirname(absolutePath), { recursive: true })

    if (existsSync(absolutePath)) {
      await copyFile(absolutePath, backupPath)
      backupsCreated.push(backupPath)
    }

    await writeFile(absolutePath, step.content, 'utf8')
    applied.push(absolutePath)
  }

  return {
    backupsCreated,
    applied
  }
}
