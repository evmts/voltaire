import { describe, test } from 'vitest'

describe('BloomFilter Primitive Examples', () => {
  test('basic-usage example works', async () => {
    await import('./basic-usage.js')
  })

  test('batch-operations example works', async () => {
    await import('./batch-operations.js')
  })

  test('ethereum-log-filtering example works', async () => {
    await import('./ethereum-log-filtering.js')
  })

  test('event-indexing example works', async () => {
    await import('./event-indexing.js')
  })

  test('false-positive-rate example works', async () => {
    await import('./false-positive-rate.js')
  })

  test('merge-filters example works', async () => {
    await import('./merge-filters.js')
  })

  test('serialization example works', async () => {
    await import('./serialization.js')
  })
})
