import type { HookItem, McpServerItem, SkillItem, UnifiedConfig } from '../../core/model/types.js'

export interface TargetPatchFile {
  path: string
  content: string
}

export interface CodexPatchResult {
  files: TargetPatchFile[]
  warnings: string[]
}

function escapeTomlString(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('\b', '\\b')
    .replaceAll('\f', '\\f')
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r')
    .replaceAll('\t', '\\t')
}

function renderTomlString(value: string): string {
  return `"${escapeTomlString(value)}"`
}

function renderTomlStringArray(values: string[]): string {
  return `[${values.map((value) => renderTomlString(value)).join(', ')}]`
}

function mapCodexSkill(skill: SkillItem, warnings: string[]): Record<string, unknown> {
  if (skill.entry !== undefined) {
    warnings.push(`Codex skill ${skill.name} ignores entry during sync.`)
  }

  if (skill.trigger !== undefined) {
    warnings.push(`Codex skill ${skill.name} ignores trigger during sync.`)
  }

  if (skill.notes !== undefined) {
    warnings.push(`Codex skill ${skill.name} ignores notes during sync.`)
  }

  if (skill.portability !== 'portable') {
    warnings.push(`Codex skill ${skill.name} ignores portability during sync.`)
  }

  return {
    name: skill.name,
    description: skill.description
  }
}

function mapCodexMcp(mcp: McpServerItem, warnings: string[]): Record<string, unknown> {
  if (mcp.env !== undefined) {
    warnings.push(`Codex MCP ${mcp.name} ignores env during sync.`)
  }

  if (mcp.transport !== undefined) {
    warnings.push(`Codex MCP ${mcp.name} ignores transport during sync.`)
  }

  if (mcp.enabled !== undefined) {
    warnings.push(`Codex MCP ${mcp.name} ignores enabled during sync.`)
  }

  if (mcp.scope !== undefined) {
    warnings.push(`Codex MCP ${mcp.name} ignores scope during sync.`)
  }

  return {
    name: mcp.name,
    command: mcp.command,
    args: mcp.args
  }
}

function mapCodexHook(hook: HookItem, warnings: string[]): Record<string, unknown> {
  if (hook.enabled !== undefined) {
    warnings.push(`Codex hook ${hook.name} (${hook.event}) ignores enabled during sync.`)
  }

  if (hook.portability !== 'portable') {
    warnings.push(`Codex hook ${hook.name} (${hook.event}) ignores portability during sync.`)
  }

  return {
    name: hook.name,
    event: hook.event,
    command: hook.command
  }
}

function renderTomlArrayOfTables(section: string, items: Record<string, unknown>[]): string[] {
  const lines: string[] = []

  for (const item of items) {
    lines.push(`[[${section}]]`)

    for (const [key, value] of Object.entries(item)) {
      if (value === undefined) {
        continue
      }

      if (typeof value === 'string') {
        lines.push(`${key} = ${renderTomlString(value)}`)
        continue
      }

      if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
        lines.push(`${key} = ${renderTomlStringArray(value)}`)
      }
    }

    lines.push('')
  }

  return lines
}

export function mapUnifiedToCodex(config: UnifiedConfig): CodexPatchResult {
  const lines: string[] = []
  const warnings: string[] = []

  if (config.profile.reasoningEffort !== undefined) {
    warnings.push('Codex profile ignores reasoningEffort during sync.')
  }

  if (config.profile.outputStyle !== undefined) {
    warnings.push('Codex profile ignores outputStyle during sync.')
  }

  if (config.profile.responseStorage !== undefined) {
    warnings.push('Codex profile ignores responseStorage during sync.')
  }

  if (config.profile.env !== undefined) {
    warnings.push('Codex profile ignores env during sync.')
  }

  const instructionCount = config.instructions.systemRules.length
    + config.instructions.outputRules.length
    + config.instructions.safetyRules.length
    + config.instructions.projectRules.length

  if (instructionCount > 0) {
    warnings.push('Codex sync ignores instructions during sync.')
  }

  if (config.agents.length > 0) {
    warnings.push('Codex sync ignores agents during sync.')
  }

  if (config.profile.model) {
    lines.push(`model = ${renderTomlString(config.profile.model)}`)
  }

  if (config.profile.approvalPolicy) {
    lines.push(`approval_policy = ${renderTomlString(config.profile.approvalPolicy)}`)
  }

  if (config.profile.sandboxMode) {
    lines.push(`sandbox_mode = ${renderTomlString(config.profile.sandboxMode)}`)
  }

  if (config.skills.length > 0) {
    if (lines.length > 0) {
      lines.push('')
    }
    lines.push(...renderTomlArrayOfTables('skills', config.skills.map((skill) => mapCodexSkill(skill, warnings))))
  }

  if (config.mcps.length > 0) {
    if (lines.length > 0 && lines[lines.length - 1] !== '') {
      lines.push('')
    }
    lines.push(...renderTomlArrayOfTables('mcps', config.mcps.map((mcp) => mapCodexMcp(mcp, warnings))))
  }

  if (config.hooks.length > 0) {
    if (lines.length > 0 && lines[lines.length - 1] !== '') {
      lines.push('')
    }
    lines.push(...renderTomlArrayOfTables('hooks', config.hooks.map((hook) => mapCodexHook(hook, warnings))))
  }

  return {
    files: [
      {
        path: '.codex/config.toml',
        content: `${lines.join('\n').trimEnd()}\n`
      }
    ],
    warnings
  }
}
