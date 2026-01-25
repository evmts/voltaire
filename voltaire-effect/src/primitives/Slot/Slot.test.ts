import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Slot from './index.js'

describe('Slot', () => {
  describe('Schema', () => {
    it('decodes number to slot', () => {
      const result = Schema.decodeSync(Slot.Schema)(1000)
      expect(typeof result).toBe('bigint')
      expect(result).toBe(1000n)
    })

    it('decodes bigint to slot', () => {
      const result = Schema.decodeSync(Slot.Schema)(5000n)
      expect(result).toBe(5000n)
    })

    it('decodes string to slot', () => {
      const result = Schema.decodeSync(Slot.Schema)('0x3e8')
      expect(result).toBe(1000n)
    })

    it('fails for negative number', () => {
      expect(() => Schema.decodeSync(Slot.Schema)(-1)).toThrow()
    })

    it('encodes slot back to bigint', () => {
      const slot = Schema.decodeSync(Slot.Schema)(100)
      const encoded = Schema.encodeSync(Slot.Schema)(slot)
      expect(encoded).toBe(100n)
    })
  })

  describe('from', () => {
    it('creates slot from number', async () => {
      const result = await Effect.runPromise(Slot.from(42))
      expect(result).toBe(42n)
    })

    it('creates slot from bigint', async () => {
      const result = await Effect.runPromise(Slot.from(100n))
      expect(result).toBe(100n)
    })

    it('fails for negative value', async () => {
      const exit = await Effect.runPromiseExit(Slot.from(-5))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('toNumber', () => {
    it('converts slot to number', async () => {
      const slot = await Effect.runPromise(Slot.from(42))
      expect(Slot.toNumber(slot)).toBe(42)
    })
  })

  describe('toEpoch', () => {
    it('converts slot to epoch', async () => {
      const slot = await Effect.runPromise(Slot.from(32))
      const epoch = Slot.toEpoch(slot)
      expect(typeof epoch).toBe('bigint')
    })
  })
})
