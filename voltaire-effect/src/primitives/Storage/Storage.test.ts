import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as StorageEffect from './index.js'

describe('Storage', () => {
  describe('StorageSlotSchema', () => {
    it('decodes bigint to StorageSlotType', () => {
      const result = Schema.decodeSync(StorageEffect.StorageSlotSchema)(0n)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('decodes number to StorageSlotType', () => {
      const result = Schema.decodeSync(StorageEffect.StorageSlotSchema)(0)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('decodes hex string to StorageSlotType', () => {
      const hexSlot = '0x' + '00'.repeat(32)
      const result = Schema.decodeSync(StorageEffect.StorageSlotSchema)(hexSlot)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('fails for wrong byte length', () => {
      const shortBytes = new Uint8Array(16)
      expect(() => Schema.decodeSync(StorageEffect.StorageSlotSchema)(shortBytes)).toThrow()
    })
  })

  describe('from', () => {
    it('creates storage slot from bigint', async () => {
      const result = await Effect.runPromise(StorageEffect.from(0n))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('creates storage slot from number', async () => {
      const result = await Effect.runPromise(StorageEffect.from(42))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('fails for negative bigint', async () => {
      const exit = await Effect.runPromiseExit(StorageEffect.from(-1n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
