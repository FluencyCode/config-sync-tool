import TOML from 'toml'

export function parseToml(content: string): unknown {
  return TOML.parse(content)
}
