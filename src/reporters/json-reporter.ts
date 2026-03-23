export interface ReportContext {
  homeDir: string
  projectDir?: string
}

export function attachReportContext<T extends object>(
  context: ReportContext,
  input: T
): T & { context: { homeDir: string, projectDir: string | null } } {
  return {
    context: {
      homeDir: context.homeDir,
      projectDir: context.projectDir ?? null
    },
    ...input
  }
}

export function renderJsonReport<T>(input: T): string {
  return JSON.stringify(input, null, 2)
}
