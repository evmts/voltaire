import { describe, test } from 'vitest'

describe('BLS12-381 Precompile Examples', () => {
  test('multi-scalar-multiplication example works', async () => {
    await import('./multi-scalar-multiplication.js')
  })

  test('signature-verification example works', async () => {
    await import('./signature-verification.js')
  })
})
