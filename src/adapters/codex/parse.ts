import { loadStructuredFile } from '../../parsers/file-loader.js'

export interface CodexParseInput {
  configPath: string
}

export interface CodexParseResult {
  config: Record<string, unknown>
  filePath: string
}

export async function parseCodexInput(
  input: CodexParseInput
): Promise<CodexParseResult> {
  const result = await loadStructuredFile(input.configPath)

  return {
    config: result.data as Record<string, unknown>,
    filePath: input.configPath
  }
}
