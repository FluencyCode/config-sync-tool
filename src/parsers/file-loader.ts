import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parseJson } from './json-parser.js'
import { parseToml } from './toml-parser.js'
import { parseYaml } from './yaml-parser.js'
import { parseMarkdown } from './markdown-parser.js'

export type StructuredFileFormat = 'json' | 'toml' | 'yaml' | 'markdown'

export interface StructuredFileResult {
  format: StructuredFileFormat
  data: unknown
  raw: string
  filePath: string
}

export async function loadStructuredFile(filePath: string): Promise<StructuredFileResult> {
  const absolutePath = path.resolve(filePath)
  const raw = await readFile(absolutePath, 'utf8')
  const extension = path.extname(filePath).toLowerCase()

  if (extension === '.json') {
    return { format: 'json', data: parseJson(raw), raw, filePath }
  }

  if (extension === '.toml') {
    return { format: 'toml', data: parseToml(raw), raw, filePath }
  }

  if (extension === '.yaml' || extension === '.yml') {
    return { format: 'yaml', data: parseYaml(raw), raw, filePath }
  }

  if (extension === '.md') {
    return { format: 'markdown', data: parseMarkdown(raw), raw, filePath }
  }

  throw new Error(`Unsupported file extension: ${extension}`)
}
