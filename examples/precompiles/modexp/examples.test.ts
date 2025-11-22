import { describe, test } from 'vitest'

describe('ModExp Precompile Examples', () => {
  test('basic-usage example works', async () => {
    await import('./basic-usage.js')
  })

  test('rsa-verification example works', async () => {
    await import('./rsa-verification.js')
  })
})
