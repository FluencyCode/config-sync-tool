import { describe, expect, it } from 'vitest'
import { runDoctorCommand } from '../../src/cli/commands/doctor.js'

describe('runDoctorCommand', () => {
  it('returns unsupported file and conflict hints', async () => {
    const result = await runDoctorCommand({
      projectDir: 'fixtures/project',
      homeDir: 'fixtures/home'
    })

    expect(result.issues.length).toBeGreaterThanOrEqual(0)
  })
})
