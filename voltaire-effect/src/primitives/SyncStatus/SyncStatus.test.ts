import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as SyncStatusEffect from './index.js'

describe('SyncStatus', () => {
  describe('SyncStatusSchema', () => {
    it('decodes false (not syncing)', () => {
      const result = Schema.decodeSync(SyncStatusEffect.SyncStatusSchema)(false)
      expect(result).toBe(false)
    })

    it('decodes sync progress object', () => {
      const result = Schema.decodeSync(SyncStatusEffect.SyncStatusSchema)({
        startingBlock: 0n,
        currentBlock: 1000n,
        highestBlock: 2000n
      })
      expect(result).not.toBe(false)
      if (result !== false) {
        expect(result.startingBlock).toBe(0n)
        expect(result.currentBlock).toBe(1000n)
        expect(result.highestBlock).toBe(2000n)
      }
    })

    it('decodes sync progress with optional fields', () => {
      const result = Schema.decodeSync(SyncStatusEffect.SyncStatusSchema)({
        startingBlock: 0n,
        currentBlock: 1000n,
        highestBlock: 2000n,
        pulledStates: 500n,
        knownStates: 1000n
      })
      if (result !== false) {
        expect(result.pulledStates).toBe(500n)
        expect(result.knownStates).toBe(1000n)
      }
    })
  })

  describe('from', () => {
    it('creates sync status from false', async () => {
      const result = await Effect.runPromise(SyncStatusEffect.from(false))
      expect(result).toBe(false)
    })

    it('creates sync status from progress object', async () => {
      const result = await Effect.runPromise(SyncStatusEffect.from({
        startingBlock: 0n,
        currentBlock: 1000n,
        highestBlock: 2000n
      }))
      expect(result).not.toBe(false)
    })

    it('creates sync status from number values', async () => {
      const result = await Effect.runPromise(SyncStatusEffect.from({
        startingBlock: 0,
        currentBlock: 1000,
        highestBlock: 2000
      }))
      expect(result).not.toBe(false)
    })
  })
})
