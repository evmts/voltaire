import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as BloomFilterEffect from './index.js'

describe('BloomFilter', () => {
  describe('create', () => {
    it('creates a bloom filter', async () => {
      const filter = await Effect.runPromise(BloomFilterEffect.create(1024, 3))
      expect(filter).toBeDefined()
      expect(filter.m).toBe(1024)
      expect(filter.k).toBe(3)
    })
  })

  describe('add and contains', () => {
    it('adds item and checks containment', async () => {
      const filter = await Effect.runPromise(BloomFilterEffect.create(1024, 3))
      const item = new Uint8Array([1, 2, 3, 4])
      
      await Effect.runPromise(BloomFilterEffect.add(filter, item))
      
      expect(BloomFilterEffect.contains(filter, item)).toBe(true)
    })

    it('returns false for non-existent item', async () => {
      const filter = await Effect.runPromise(BloomFilterEffect.create(1024, 3))
      const item = new Uint8Array([1, 2, 3, 4])
      
      expect(BloomFilterEffect.contains(filter, item)).toBe(false)
    })
  })

  describe('isEmpty', () => {
    it('returns true for empty filter', async () => {
      const filter = await Effect.runPromise(BloomFilterEffect.create(1024, 3))
      expect(BloomFilterEffect.isEmpty(filter)).toBe(true)
    })

    it('returns false after adding item', async () => {
      const filter = await Effect.runPromise(BloomFilterEffect.create(1024, 3))
      const item = new Uint8Array([1, 2, 3, 4])
      
      await Effect.runPromise(BloomFilterEffect.add(filter, item))
      
      expect(BloomFilterEffect.isEmpty(filter)).toBe(false)
    })
  })

  describe('toHex and fromHex', () => {
    it('round-trips through hex', async () => {
      const filter = await Effect.runPromise(BloomFilterEffect.create(1024, 3))
      const item = new Uint8Array([1, 2, 3, 4])
      
      await Effect.runPromise(BloomFilterEffect.add(filter, item))
      
      const hex = BloomFilterEffect.toHex(filter)
      const restored = await Effect.runPromise(BloomFilterEffect.fromHex(hex, 1024, 3))
      
      expect(BloomFilterEffect.contains(restored, item)).toBe(true)
    })
  })
})
