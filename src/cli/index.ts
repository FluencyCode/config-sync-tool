import { Command, InvalidArgumentError } from 'commander'
import { runScanCommand } from './commands/scan.js'
import { runDiffCommand } from './commands/diff.js'
import { runSyncCommand } from './commands/sync.js'
import { runDoctorCommand } from './commands/doctor.js'

interface CliSharedOptions {
  homeDir: string
  projectDir: string
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
    .requiredOption('--home-dir <path>')
    .requiredOption('--project-dir <path>')
}

export function buildCli(): Command {
  const cli = new Command()

  cli.name('config-sync')

  addSharedPathOptions(cli.command('scan')).action(async (options: CliSharedOptions) => {
    await runScanCommand({
      homeDir: options.homeDir,
      projectDir: options.projectDir
    })
  })

  addSharedPathOptions(cli.command('diff'))
    .requiredOption('--from <tool>', 'source tool', parseTool)
    .requiredOption('--to <tool>', 'target tool', parseTool)
    .action(async (options: CliDiffOptions) => {
      validateToolPair(options.from, options.to)
      await runDiffCommand({
        from: options.from,
        to: options.to,
        dryRun: true,
        homeDir: options.homeDir,
        projectDir: options.projectDir
      })
    })

  addSharedPathOptions(cli.command('sync'))
    .requiredOption('--from <tool>', 'source tool', parseTool)
    .requiredOption('--to <tool>', 'target tool', parseTool)
    .option('--write')
    .action(async (options: CliDiffOptions) => {
      validateToolPair(options.from, options.to)
      await runSyncCommand({
        from: options.from,
        to: options.to,
        dryRun: !options.write,
        homeDir: options.homeDir,
        projectDir: options.projectDir
      })
    })

  addSharedPathOptions(cli.command('doctor')).action(async (options: CliSharedOptions) => {
    await runDoctorCommand({
      homeDir: options.homeDir,
      projectDir: options.projectDir
    })
  })

  return cli
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  buildCli().parseAsync(process.argv)
}
