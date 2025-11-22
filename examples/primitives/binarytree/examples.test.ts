import { describe, test } from 'vitest'

describe('BinaryTree Primitive Examples', () => {
  test('account-management example works', async () => {
    await import('./account-management.js')
  })

  test('basic-operations example works', async () => {
    await import('./basic-operations.js')
  })

  test('hashing example works', async () => {
    await import('./hashing.js')
  })

  test('key-utilities example works', async () => {
    await import('./key-utilities.js')
  })

  test('merkle-tree example works', async () => {
    await import('./merkle-tree.js')
  })

  test('state-transitions example works', async () => {
    await import('./state-transitions.js')
  })
})
