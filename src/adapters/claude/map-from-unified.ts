import type { HookItem, McpServerItem, SkillItem, UnifiedConfig } from '../../core/model/types.js'

export interface TargetPatchFile {
  path: string
  content: string
}

export interface ClaudePatchResult {
  files: TargetPatchFile[]
  warnings: string[]
}

function mapClaudeSkill(skill: SkillItem, warnings: string[]): Record<string, unknown> {
  if (skill.entry !== undefined) {
    warnings.push(`Claude skill ${skill.name} ignores entry during sync.`)
  }

  if (skill.trigger !== undefined) {
    warnings.push(`Claude skill ${skill.name} ignores trigger during sync.`)
  }

  if (skill.notes !== undefined) {
    warnings.push(`Claude skill ${skill.name} ignores notes during sync.`)
  }

  if (skill.portability !== 'portable') {
    warnings.push(`Claude skill ${skill.name} ignores portability during sync.`)
  }

  return {
    name: skill.name,
    description: skill.description
  }
}

function mapClaudeMcp(mcp: McpServerItem, warnings: string[]): Record<string, unknown> {
  if (mcp.env !== undefined) {
    warnings.push(`Claude MCP ${mcp.name} ignores env during sync.`)
  }

  if (mcp.transport !== undefined) {
    warnings.push(`Claude MCP ${mcp.name} ignores transport during sync.`)
  }

  if (mcp.enabled !== undefined) {
    warnings.push(`Claude MCP ${mcp.name} ignores enabled during sync.`)
  }

  if (mcp.scope !== undefined) {
    warnings.push(`Claude MCP ${mcp.name} ignores scope during sync.`)
  }

  return {
    name: mcp.name,
    command: mcp.command,
    args: mcp.args
  }
}

function mapClaudeHook(hook: HookItem, warnings: string[]): Record<string, unknown> {
  if (hook.enabled !== undefined) {
    warnings.push(`Claude hook ${hook.name} (${hook.event}) ignores enabled during sync.`)
  }

  if (hook.portability !== 'portable') {
    warnings.push(`Claude hook ${hook.name} (${hook.event}) ignores portability during sync.`)
  }

  return {
    name: hook.name,
    event: hook.event,
    command: hook.command
  }
}

export function mapUnifiedToClaude(config: UnifiedConfig): ClaudePatchResult {
  const files: TargetPatchFile[] = []
  const warnings: string[] = []

  files.push({
    path: '.claude/settings.json',
    content: JSON.stringify(
      {
        model: config.profile.model,
        skills: config.skills.map((skill) => mapClaudeSkill(skill, warnings)),
        mcps: config.mcps.map((mcp) => mapClaudeMcp(mcp, warnings)),
        hooks: config.hooks.map((hook) => mapClaudeHook(hook, warnings))
      },
      null,
      2
    )
  })

  if (config.instructions.systemRules.length > 0) {
    files.push({
      path: '.claude/CLAUDE.md',
      content: config.instructions.systemRules.map((rule) => rule.content).join('\n\n')
    })
  }

  return {
    files,
    warnings
  }
}
