import { describe, test } from 'vitest'

describe('BLS12-381 Examples', () => {
  test('basic-operations example works', async () => {
    await import('./basic-operations.js')
  })

  test('pairing-check example works', async () => {
    await import('./pairing-check.js')
  })

  test('proof-of-possession example works', async () => {
    await import('./proof-of-possession.js')
  })

  test('signature-aggregation example works', async () => {
    await import('./signature-aggregation.js')
  })

  test('signature-basic example works', async () => {
    await import('./signature-basic.js')
  })

  test('sync-committee example works', async () => {
    await import('./sync-committee.js')
  })
})
