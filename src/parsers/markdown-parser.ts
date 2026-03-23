export interface MarkdownParseResult {
  raw: string
  headings: string[]
}

export function parseMarkdown(content: string): MarkdownParseResult {
  const headings = content
    .split(/\r?\n/)
    .filter((line) => /^#{1,6}\s+/.test(line))
    .map((line) => line.replace(/^#{1,6}\s+/, '').trim())

  return {
    raw: content,
    headings
  }
}
