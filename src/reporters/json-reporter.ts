export function renderJsonReport<T>(input: T): string {
  return JSON.stringify(input, null, 2)
}
