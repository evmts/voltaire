import { describe, test } from 'vitest'

describe('EIP-712 Examples', () => {
  test('basic-signing example works', async () => {
    await import('./basic-signing.js')
  })

  test('permit-gasless example works', async () => {
    await import('./permit-gasless.js')
  })
})
