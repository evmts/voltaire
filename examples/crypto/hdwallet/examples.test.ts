import { describe, test } from 'vitest'

describe('HDWallet Examples', () => {
  test('basic-derivation example works', async () => {
    await import('./basic-derivation.js')
  })
})
