export interface TextReportInput {
  title: string
  lines: string[]
}

interface TextReportContext {
  homeDir: string
  projectDir?: string
}

function buildContextLines(context: TextReportContext): string[] {
  return [
    `home-dir: ${context.homeDir}`,
    `project-dir: ${context.projectDir ?? 'disabled'}`
  ]
}

export function renderTextReport(input: TextReportInput): string {
  return [input.title, ...input.lines].join('\n')
}

export function renderDoctorTextReport(input: {
  homeDir: string
  projectDir?: string
  issues: Array<{ code: string, message: string }>
}): string {
  if (input.issues.length === 0) {
    return renderTextReport({
      title: 'Doctor result',
      lines: [...buildContextLines(input), 'OK']
    })
  }

  return renderTextReport({
    title: 'Doctor result',
    lines: [
      ...buildContextLines(input),
      ...input.issues.map((issue) => `${issue.code}: ${issue.message}`)
    ]
  })
}

export function renderScanTextReport(input: {
  homeDir: string
  projectDir?: string
  sources: Array<{ tool: string, scope: string, path: string }>
}): string {
  return renderTextReport({
    title: 'Scan result',
    lines: [
      ...buildContextLines(input),
      ...(input.sources.length === 0
        ? ['No config sources found.']
        : input.sources.map((source) => `${source.tool} [${source.scope}] ${source.path}`))
    ]
  })
}

export function renderDiffTextReport(input: {
  from: string
  to: string
  homeDir: string
  projectDir?: string
  changeCount: number
}): string {
  return renderTextReport({
    title: `Diff result (${input.from} -> ${input.to})`,
    lines: [
      ...buildContextLines(input),
      `changes: ${input.changeCount}`
    ]
  })
}

export function renderSyncTextReport(input: {
  homeDir: string
  projectDir?: string
  dryRun: boolean
  summary: {
    applied: number
    warnings: number
    skipped: number
  }
  appliedFiles: string[]
}): string {
  const lines = [
    ...buildContextLines(input),
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
