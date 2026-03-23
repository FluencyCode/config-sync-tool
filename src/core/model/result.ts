export interface ChangeItem {
  path: string
  action: 'create' | 'update' | 'delete'
  detail: string
}

export interface WarningItem {
  code: string
  message: string
  path?: string
}

export interface SkippedItem {
  code: string
  reason: string
  path?: string
}

export interface ManualAction {
  title: string
  description: string
  path?: string
}

export interface SyncResult {
  applied: ChangeItem[]
  warnings: WarningItem[]
  skipped: SkippedItem[]
  manualActions: ManualAction[]
}
