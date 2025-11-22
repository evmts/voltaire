import { describe, test } from 'vitest'

describe('SHA256 Examples', () => {
  test('basic-usage example works', async () => {
    await import('./basic-usage.js')
  })

  test('bitcoin-addresses example works', async () => {
    await import('./bitcoin-addresses.js')
  })

  test('comparison example works', async () => {
    await import('./comparison.js')
  })

  test('hmac example works', async () => {
    await import('./hmac.js')
  })

  test('merkle-tree example works', async () => {
    await import('./merkle-tree.js')
  })

  test('streaming-api example works', async () => {
    await import('./streaming-api.js')
  })

  test('test-vectors example works', async () => {
    await import('./test-vectors.js')
  })
})
