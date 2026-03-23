export interface TextReportInput {
  title: string
  lines: string[]
}

export function renderTextReport(input: TextReportInput): string {
  return [input.title, ...input.lines].join('\n')
}
