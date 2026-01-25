import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as StealthAddressEffect from './index.js'

describe('StealthAddress', () => {
  const mockSpendingPubKey = new Uint8Array(33).fill(0x02)
  const mockViewingPubKey = new Uint8Array(33).fill(0x03)

  describe('generateMetaAddress', () => {
    it('generates meta address from valid public keys', async () => {
      const result = await Effect.runPromise(
        StealthAddressEffect.generateMetaAddress(
          mockSpendingPubKey as any,
          mockViewingPubKey as any
        )
      )
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(66)
    })
  })

  describe('parseMetaAddress', () => {
    it('fails for invalid meta address length', async () => {
      const invalidMeta = new Uint8Array(32)
      const exit = await Effect.runPromiseExit(
        StealthAddressEffect.parseMetaAddress(invalidMeta)
      )
      expect(Exit.isFailure(exit)).toBe(true)
    })

    it('parses valid 66-byte meta address', async () => {
      const validMeta = new Uint8Array(66)
      validMeta.set(mockSpendingPubKey, 0)
      validMeta.set(mockViewingPubKey, 33)
      
      const result = await Effect.runPromise(
        StealthAddressEffect.parseMetaAddress(validMeta)
      )
      expect(result.spendingPubKey).toBeInstanceOf(Uint8Array)
      expect(result.viewingPubKey).toBeInstanceOf(Uint8Array)
    })
  })
})
