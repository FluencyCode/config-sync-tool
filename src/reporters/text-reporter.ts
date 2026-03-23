export interface TextReportInput {
  title: string
  lines: string[]
}

export function renderTextReport(input: TextReportInput): string {
  return [input.title, ...input.lines].join('\n')
}

export function renderDoctorTextReport(issues: Array<{ code: string, message: string }>): string {
  if (issues.length === 0) {
    return renderTextReport({
      title: 'Doctor result',
      lines: ['OK']
    })
  }

  return renderTextReport({
    title: 'Doctor result',
    lines: issues.map((issue) => `${issue.code}: ${issue.message}`)
  })
}

export function renderScanTextReport(sources: Array<{ tool: string, scope: string, path: string }>): string {
  return renderTextReport({
    title: 'Scan result',
    lines: sources.length === 0
      ? ['No config sources found.']
      : sources.map((source) => `${source.tool} [${source.scope}] ${source.path}`)
  })
}

export function renderDiffTextReport(input: {
  from: string
  to: string
  changeCount: number
}): string {
  return renderTextReport({
    title: `Diff result (${input.from} -> ${input.to})`,
    lines: [`changes: ${input.changeCount}`]
  })
}

export function renderSyncTextReport(input: {
  dryRun: boolean
  summary: {
    applied: number
    warnings: number
    skipped: number
  }
  appliedFiles: string[]
}): string {
  const lines = [
    `mode: ${input.dryRun ? 'dry-run' : 'write'}`,
    `applied: ${input.summary.applied}`,
    `warnings: ${input.summary.warnings}`,
    `skipped: ${input.summary.skipped}`,
    ...input.appliedFiles.map((file) => `file: ${file}`)
  ]

  return renderTextReport({
    title: 'Sync result',
    lines
  })
}
