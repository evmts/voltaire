import { describe, test } from 'vitest'

describe('KZG Examples', () => {
  test('basic-commitment example works', async () => {
    await import('./basic-commitment.js')
  })

  test('batch-verification example works', async () => {
    await import('./batch-verification.js')
  })

  test('data-availability example works', async () => {
    await import('./data-availability.js')
  })

  test('eip4844-transaction example works', async () => {
    await import('./eip4844-transaction.js')
  })

  test('point-evaluation example works', async () => {
    await import('./point-evaluation.js')
  })

  test('proof-generation example works', async () => {
    await import('./proof-generation.js')
  })

  test('trusted-setup example works', async () => {
    await import('./trusted-setup.js')
  })

  test('versioned-hashes example works', async () => {
    await import('./versioned-hashes.js')
  })
})
