export type ConflictMode = 'loose' | 'strict'

export function isWarningProfileKey(key: string): boolean {
  return key === 'outputStyle'
}
