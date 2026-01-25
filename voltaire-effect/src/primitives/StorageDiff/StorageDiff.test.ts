import { describe, it, expect } from 'vitest'
import { Address } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as StorageDiffEffect from './index.js'

describe('StorageDiff', () => {
  const mockAddress = Address('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')

  describe('from', () => {
    it('creates storage diff from address and empty map', async () => {
      const result = await Effect.runPromise(
        StorageDiffEffect.from(mockAddress, new Map())
      )
      expect(result.address).toBe(mockAddress)
      expect(result.changes).toBeInstanceOf(Map)
      expect(result.changes.size).toBe(0)
    })

    it('creates storage diff from address and array of changes', async () => {
      const result = await Effect.runPromise(
        StorageDiffEffect.from(mockAddress, [])
      )
      expect(result.address).toBe(mockAddress)
      expect(result.changes).toBeInstanceOf(Map)
    })

    it('fails for null address', async () => {
      const exit = await Effect.runPromiseExit(
        StorageDiffEffect.from(null as any, new Map())
      )
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
