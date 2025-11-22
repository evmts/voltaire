import { describe, test } from 'vitest'

describe('Chain Primitive Examples', () => {
  test('basic-lookup example works', async () => {
    await import('./basic-lookup.js')
  })

  test('chain-registry example works', async () => {
    await import('./chain-registry.js')
  })

  test('chain-validation example works', async () => {
    await import('./chain-validation.js')
  })

  test('gas-comparison example works', async () => {
    await import('./gas-comparison.js')
  })

  test('multi-chain-support example works', async () => {
    await import('./multi-chain-support.js')
  })

  test('network-detection example works', async () => {
    await import('./network-detection.js')
  })

  test('network-metadata example works', async () => {
    await import('./network-metadata.js')
  })

  test('rpc-management example works', async () => {
    await import('./rpc-management.js')
  })
})
