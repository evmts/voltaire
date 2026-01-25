import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as NetworkId from './index.js'

describe('NetworkId', () => {
  describe('NetworkIdSchema', () => {
    it('decodes non-negative integer to NetworkIdType', () => {
      const result = Schema.decodeSync(NetworkId.NetworkIdSchema)(1)
      expect(typeof result).toBe('number')
      expect(result).toBe(1)
    })

    it('decodes mainnet network ID', () => {
      const result = Schema.decodeSync(NetworkId.NetworkIdSchema)(1)
      expect(result).toBe(1)
    })

    it('decodes sepolia network ID', () => {
      const result = Schema.decodeSync(NetworkId.NetworkIdSchema)(11155111)
      expect(result).toBe(11155111)
    })

    it('decodes zero (valid network ID)', () => {
      const result = Schema.decodeSync(NetworkId.NetworkIdSchema)(0)
      expect(result).toBe(0)
    })

    it('fails for negative number', () => {
      expect(() => Schema.decodeSync(NetworkId.NetworkIdSchema)(-1)).toThrow()
    })

    it('fails for non-integer', () => {
      expect(() => Schema.decodeSync(NetworkId.NetworkIdSchema)(1.5)).toThrow()
    })

    it('encodes NetworkIdType back to number', () => {
      const networkId = Schema.decodeSync(NetworkId.NetworkIdSchema)(1)
      const result = Schema.encodeSync(NetworkId.NetworkIdSchema)(networkId)
      expect(result).toBe(1)
    })
  })

  describe('from', () => {
    it('creates NetworkId from non-negative integer', async () => {
      const result = await Effect.runPromise(NetworkId.from(1))
      expect(typeof result).toBe('number')
      expect(result).toBe(1)
    })

    it('creates NetworkId from large network ID', async () => {
      const result = await Effect.runPromise(NetworkId.from(11155111))
      expect(result).toBe(11155111)
    })

    it('creates NetworkId from zero', async () => {
      const result = await Effect.runPromise(NetworkId.from(0))
      expect(result).toBe(0)
    })

    it('fails for negative number', async () => {
      const exit = await Effect.runPromiseExit(NetworkId.from(-5))
      expect(Exit.isFailure(exit)).toBe(true)
    })

    it('fails for non-integer', async () => {
      const exit = await Effect.runPromiseExit(NetworkId.from(1.5))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('constants', () => {
    it('exports MAINNET', () => {
      expect(NetworkId.MAINNET).toBe(1)
    })

    it('exports GOERLI', () => {
      expect(NetworkId.GOERLI).toBe(5)
    })

    it('exports SEPOLIA', () => {
      expect(NetworkId.SEPOLIA).toBe(11155111)
    })

    it('exports HOLESKY', () => {
      expect(NetworkId.HOLESKY).toBe(17000)
    })
  })
})
