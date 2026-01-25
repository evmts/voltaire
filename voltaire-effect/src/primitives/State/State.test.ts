import { describe, it, expect } from 'vitest'
import * as S from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as State from './index.js'
import { Address } from '@tevm/voltaire'

describe('State', () => {
  const mockAddr = Address('0x1234567890123456789012345678901234567890')

  describe('StorageKeySchema', () => {
    it('validates storage key', () => {
      const key = { address: mockAddr, slot: 0n }
      const result = S.is(State.StorageKeySchema)(key)
      expect(result).toBe(true)
    })

    it('rejects invalid key', () => {
      const invalid = { foo: 'bar' }
      const result = S.is(State.StorageKeySchema)(invalid)
      expect(result).toBe(false)
    })
  })

  describe('from', () => {
    it('creates storage key from object', async () => {
      const result = await Effect.runPromise(State.from({ address: mockAddr, slot: 0n }))
      expect(result.slot).toBe(0n)
    })
  })

  describe('create', () => {
    it('creates storage key from address and slot', async () => {
      const result = await Effect.runPromise(State.create('0x1234567890123456789012345678901234567890', 5n))
      expect(result.slot).toBe(5n)
    })
  })

  describe('toString', () => {
    it('converts key to string', async () => {
      const key = await Effect.runPromise(State.from({ address: mockAddr, slot: 0n }))
      const str = State.toString(key)
      expect(typeof str).toBe('string')
    })
  })

  describe('equals', () => {
    it('compares equal keys', async () => {
      const key1 = await Effect.runPromise(State.from({ address: mockAddr, slot: 0n }))
      const key2 = await Effect.runPromise(State.from({ address: mockAddr, slot: 0n }))
      expect(State.equals(key1, key2)).toBe(true)
    })

    it('compares unequal keys', async () => {
      const key1 = await Effect.runPromise(State.from({ address: mockAddr, slot: 0n }))
      const key2 = await Effect.runPromise(State.from({ address: mockAddr, slot: 1n }))
      expect(State.equals(key1, key2)).toBe(false)
    })
  })

  describe('is', () => {
    it('validates storage key type', async () => {
      const key = await Effect.runPromise(State.from({ address: mockAddr, slot: 0n }))
      expect(State.is(key)).toBe(true)
    })

    it('rejects non-storage key', () => {
      expect(State.is({ foo: 'bar' })).toBe(false)
    })
  })
})
