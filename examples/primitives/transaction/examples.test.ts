import { describe, test } from 'vitest'

describe('Transaction Primitive Examples', () => {
  test('blob-transaction example works', async () => {
    await import('./blob-transaction.js')
  })

  test('create-legacy example works', async () => {
    await import('./create-legacy.js')
  })

  test('eip1559-transaction example works', async () => {
    await import('./eip1559-transaction.js')
  })

  test('eip2930-access-list example works', async () => {
    await import('./eip2930-access-list.js')
  })

  test('eip7702-authorization example works', async () => {
    await import('./eip7702-authorization.js')
  })

  test('gas-calculations example works', async () => {
    await import('./gas-calculations.js')
  })

  test('serialize-transaction example works', async () => {
    await import('./serialize-transaction.js')
  })

  test('sign-hash-transaction example works', async () => {
    await import('./sign-hash-transaction.js')
  })

  test('type-detection example works', async () => {
    await import('./type-detection.js')
  })

  test('verify-recover-sender example works', async () => {
    await import('./verify-recover-sender.js')
  })
})
