import { createBaseUnifiedConfig } from '../../core/normalize/unified-config.js'
import type { ConfigScope, UnifiedConfig } from '../../core/model/types.js'

export interface MapCodexToUnifiedInput {
  config: Record<string, unknown>
  scope: ConfigScope
  filePath: string
}

export async function mapCodexToUnified(
  input: MapCodexToUnifiedInput
): Promise<UnifiedConfig> {
  const config = createBaseUnifiedConfig('codex', input.scope, [input.filePath])

  if (typeof input.config.model === 'string') {
    config.profile.model = input.config.model
  }

  if (typeof input.config.approval_policy === 'string') {
    config.profile.approvalPolicy = input.config.approval_policy
  }

  if (typeof input.config.sandbox_mode === 'string') {
    config.profile.sandboxMode = input.config.sandbox_mode
  }

  return config
}
