import { describe, test } from 'vitest'

describe('AesGcm Examples', () => {
  test('basic-usage example works', async () => {
    await import('./basic-usage.js')
  })

  test('file-encryption example works', async () => {
    await import('./file-encryption.js')
  })

  test('password-encryption example works', async () => {
    await import('./password-encryption.js')
  })

  test('wallet-encryption example works', async () => {
    await import('./wallet-encryption.js')
  })
})
