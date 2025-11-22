import { describe, test } from 'vitest'

describe('BN254 Examples', () => {
  test('g1-g2-basics example works', async () => {
    await import('./g1-g2-basics.js')
  })

  test('groth16-verification example works', async () => {
    await import('./groth16-verification.js')
  })

  test('pairing-check example works', async () => {
    await import('./pairing-check.js')
  })

  test('precompile-usage example works', async () => {
    await import('./precompile-usage.js')
  })

  test('proof-structure example works', async () => {
    await import('./proof-structure.js')
  })

  test('serialization example works', async () => {
    await import('./serialization.js')
  })
})
