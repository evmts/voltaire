import { describe, test } from 'vitest'

describe('SHA256 Precompile Examples', () => {
  test('basic-usage example works', async () => {
    await import('./basic-usage.js')
  })

  test('bitcoin-integration example works', async () => {
    await import('./bitcoin-integration.js')
  })
})
