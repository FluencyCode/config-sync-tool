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
import { renderJsonReport } from '../reporters/json-reporter.js'

interface CliSharedOptions {
  homeDir: string
  projectDir: string
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
    .requiredOption('--home-dir <path>')
    .requiredOption('--project-dir <path>')
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
    const result = await runScanCommand({
      homeDir: options.homeDir,
      projectDir: options.projectDir
    })
    console.log(options.json ? renderJsonReport(result) : renderScanTextReport(result.sources))
  })

  addSharedPathOptions(cli.command('diff'))
    .requiredOption('--from <tool>', 'source tool', parseTool)
    .requiredOption('--to <tool>', 'target tool', parseTool)
    .action(async (options: CliDiffOptions) => {
      validateToolPair(options.from, options.to)
      const result = await runDiffCommand({
        from: options.from,
        to: options.to,
        dryRun: true,
        homeDir: options.homeDir,
        projectDir: options.projectDir
      })
      console.log(options.json
        ? renderJsonReport(result)
        : renderDiffTextReport({
            from: options.from,
            to: options.to,
            changeCount: result.diff.profileChanges.length + result.diff.ruleChanges.length
          }))
    })

  addSharedPathOptions(cli.command('sync'))
    .requiredOption('--from <tool>', 'source tool', parseTool)
    .requiredOption('--to <tool>', 'target tool', parseTool)
    .option('--write')
    .action(async (options: CliDiffOptions) => {
      validateToolPair(options.from, options.to)
      const result = await runSyncCommand({
        from: options.from,
        to: options.to,
        dryRun: !options.write,
        homeDir: options.homeDir,
        projectDir: options.projectDir
      })
      console.log(options.json
        ? renderJsonReport(result)
        : renderSyncTextReport({
            dryRun: !options.write,
            summary: result.summary,
            appliedFiles: result.appliedFiles
          }))
    })

  addSharedPathOptions(cli.command('doctor')).action(async (options: CliSharedOptions) => {
    const result = await runDoctorCommand({
      homeDir: options.homeDir,
      projectDir: options.projectDir
    })
    console.log(options.json ? renderJsonReport(result) : renderDoctorTextReport(result.issues))
  })

  return cli
}

if (isCliEntrypoint(import.meta.url, process.argv[1])) {
  buildCli().parseAsync(process.argv)
}
