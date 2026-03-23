import type { ConfigScope, UnifiedConfig } from '../model/types.js'
import { createEmptyUnifiedConfig } from '../model/types.js'

export function createBaseUnifiedConfig(
  source: 'claude' | 'codex',
  scope: ConfigScope,
  files: string[] = []
): UnifiedConfig {
  const config = createEmptyUnifiedConfig(source, scope)
  config.metadata.files = files
  return config
}
