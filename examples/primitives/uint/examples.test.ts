import { describe, test } from 'vitest'

describe('Uint Primitive Examples', () => {
  test('arithmetic-operations example works', async () => {
    await import('./arithmetic-operations.js')
  })

  test('basic-usage example works', async () => {
    await import('./basic-usage.js')
  })

  test('bitwise-operations example works', async () => {
    await import('./bitwise-operations.js')
  })

  test('gas-calculations example works', async () => {
    await import('./gas-calculations.js')
  })

  test('utilities example works', async () => {
    await import('./utilities.js')
  })

  test('wei-conversions example works', async () => {
    await import('./wei-conversions.js')
  })
})
