import YAML from 'yaml'

export function parseYaml(content: string): unknown {
  return YAML.parse(content)
}
