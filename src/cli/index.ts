import os from 'node:os'
import { pathToFileURL } from 'node:url'
import { Command, InvalidArgumentError } from 'commander'
import { runScanCommand } from './commands/scan.js'
import { runDiffCommand } from './commands/diff.js'
import { runSyncCommand } from './commands/sync.js'
import { runDoctorCommand } from './commands/doctor.js'
import {
  renderDoctorTextReport,
  renderScanTextReport,
  renderDiffTextReport,
  renderSyncTextReport
} from '../reporters/text-reporter.js'
import {
  attachReportContext,
  renderJsonReport
} from '../reporters/json-reporter.js'

interface CliSharedOptions {
  homeDir?: string
  projectDir?: string
  json?: boolean
}

interface CliDiffOptions extends CliSharedOptions {
  from: 'claude' | 'codex'
  to: 'claude' | 'codex'
  write?: boolean
}

export function parseTool(value: string): 'claude' | 'codex' {
  if (value === 'claude' || value === 'codex') {
    return value
  }

  throw new InvalidArgumentError('tool must be one of: claude, codex')
}

export function validateToolPair(
  from: 'claude' | 'codex',
  to: 'claude' | 'codex'
): void {
  if (from === to) {
    throw new InvalidArgumentError('from and to must be different tools')
  }
}

function addSharedPathOptions(command: Command): Command {
  return command
    .option('--json')
    .option('--home-dir <path>')
    .option('--project-dir <path>')
}

function resolveCliContext(options: CliSharedOptions): { homeDir: string, projectDir?: string } {
  return {
    homeDir: options.homeDir ?? os.homedir(),
    projectDir: options.projectDir
  }
}

export function isCliEntrypoint(importMetaUrl: string, argv1?: string): boolean {
  if (!argv1) {
    return false
  }

  return importMetaUrl === pathToFileURL(argv1).href
}

export function buildCli(): Command {
  const cli = new Command()

  cli.name('config-sync')

  addSharedPathOptions(cli.command('scan')).action(async (options: CliSharedOptions) => {
    const context = resolveCliContext(options)
    const result = await runScanCommand(context)
    console.log(options.json
      ? renderJsonReport(attachReportContext(context, result))
      : renderScanTextReport({
          homeDir: context.homeDir,
          projectDir: context.projectDir,
          sources: result.sources
        }))
  })

  addSharedPathOptions(cli.command('diff'))
    .requiredOption('--from <tool>', 'source tool', parseTool)
    .requiredOption('--to <tool>', 'target tool', parseTool)
    .action(async (options: CliDiffOptions) => {
      validateToolPair(options.from, options.to)
      const context = resolveCliContext(options)
      const result = await runDiffCommand({
        from: options.from,
        to: options.to,
        dryRun: true,
        homeDir: context.homeDir,
        projectDir: context.projectDir
      })
      console.log(options.json
        ? renderJsonReport(attachReportContext(context, result))
        : renderDiffTextReport({
            from: options.from,
            to: options.to,
            homeDir: context.homeDir,
            projectDir: context.projectDir,
            changeCount: result.diff.profileChanges.length + result.diff.ruleChanges.length
          }))
    })

  addSharedPathOptions(cli.command('sync'))
    .requiredOption('--from <tool>', 'source tool', parseTool)
    .requiredOption('--to <tool>', 'target tool', parseTool)
    .option('--write')
    .action(async (options: CliDiffOptions) => {
      validateToolPair(options.from, options.to)
      const context = resolveCliContext(options)
      const result = await runSyncCommand({
        from: options.from,
        to: options.to,
        dryRun: !options.write,
        homeDir: context.homeDir,
        projectDir: context.projectDir
      })
      console.log(options.json
        ? renderJsonReport(attachReportContext(context, result))
        : renderSyncTextReport({
            homeDir: context.homeDir,
            projectDir: context.projectDir,
            dryRun: !options.write,
            summary: result.summary,
            appliedFiles: result.appliedFiles
          }))
    })

  addSharedPathOptions(cli.command('doctor')).action(async (options: CliSharedOptions) => {
    const context = resolveCliContext(options)
    const result = await runDoctorCommand(context)
    console.log(options.json
      ? renderJsonReport(attachReportContext(context, result))
      : renderDoctorTextReport({
          homeDir: context.homeDir,
          projectDir: context.projectDir,
          issues: result.issues
        }))
  })

  return cli
}

if (isCliEntrypoint(import.meta.url, process.argv[1])) {
  buildCli().parseAsync(process.argv)
}
