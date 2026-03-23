import { scanSources } from '../../parsers/scan-sources.js'

export interface RunDoctorCommandOptions {
  homeDir: string
  projectDir?: string
}

export interface DoctorIssue {
  code: string
  message: string
}

export interface DoctorCommandResult {
  issues: DoctorIssue[]
}

export async function runDoctorCommand(
  options: RunDoctorCommandOptions
): Promise<DoctorCommandResult> {
  const discovered = await scanSources(options)
  const issues: DoctorIssue[] = []

  if (discovered.claude.length === 0) {
    issues.push({
      code: 'CLAUDE_NOT_FOUND',
      message: 'No Claude config sources found.'
    })
  }

  if (discovered.codex.length === 0) {
    issues.push({
      code: 'CODEX_NOT_FOUND',
      message: 'No Codex config sources found.'
    })
  }

  return {
    issues
  }
}
