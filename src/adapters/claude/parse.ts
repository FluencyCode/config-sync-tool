import { loadStructuredFile } from '../../parsers/file-loader.js'

export interface ClaudeRuleFileInput {
  path: string
  content?: string
}

export interface ClaudeParseInput {
  settingsPath?: string
  rulePaths?: string[]
}

export interface ClaudeParseResult {
  settings: Record<string, unknown>
  ruleFiles: Array<{
    path: string
    content: string
  }>
}

export async function parseClaudeInput(
  input: ClaudeParseInput
): Promise<ClaudeParseResult> {
  const settings = input.settingsPath
    ? ((await loadStructuredFile(input.settingsPath)).data as Record<string, unknown>)
    : {}

  const ruleFiles = await Promise.all(
    (input.rulePaths ?? []).map(async (rulePath) => {
      const result = await loadStructuredFile(rulePath)
      return {
        path: rulePath,
        content: result.raw
      }
    })
  )

  return {
    settings,
    ruleFiles
  }
}
