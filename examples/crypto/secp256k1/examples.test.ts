import { describe, test } from 'vitest'

describe('Secp256k1 Examples', () => {
  test('address-recovery example works', async () => {
    await import('./address-recovery.js')
  })

  test('basic-signing example works', async () => {
    await import('./basic-signing.js')
  })

  test('key-derivation example works', async () => {
    await import('./key-derivation.js')
  })

  test('personal-sign example works', async () => {
    await import('./personal-sign.js')
  })

  test('signature-validation example works', async () => {
    await import('./signature-validation.js')
  })

  test('transaction-signing example works', async () => {
    await import('./transaction-signing.js')
  })
})
