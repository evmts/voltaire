import { describe, test } from 'vitest'

describe('Getting Started Examples', () => {
  test('hello-voltaire example works', async () => {
    await import('./hello-voltaire.js')
  })
})
