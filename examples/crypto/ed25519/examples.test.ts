import { describe, test } from 'vitest'

describe('Ed25519 Examples', () => {
  test('basic-usage example works', async () => {
    await import('./basic-usage.js')
  })

  test('signal-protocol example works', async () => {
    await import('./signal-protocol.js')
  })

  test('solana-transactions example works', async () => {
    await import('./solana-transactions.js')
  })

  test('ssh-signatures example works', async () => {
    await import('./ssh-signatures.js')
  })
})
