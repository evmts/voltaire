import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as GasUsed from './index.js'

describe('GasUsed', () => {
  describe('Schema', () => {
    it('decodes bigint', () => {
      const result = Schema.decodeSync(GasUsed.Schema)(21000n)
      expect(typeof result).toBe('bigint')
    })

    it('decodes number', () => {
      const result = Schema.decodeSync(GasUsed.Schema)(21000)
      expect(typeof result).toBe('bigint')
    })

    it('decodes hex string', () => {
      const result = Schema.decodeSync(GasUsed.Schema)('0x5208')
      expect(typeof result).toBe('bigint')
      expect(result).toBe(21000n)
    })

    it('encodes back to bigint', () => {
      const decoded = Schema.decodeSync(GasUsed.Schema)(21000n)
      const encoded = Schema.encodeSync(GasUsed.Schema)(decoded)
      expect(encoded).toBe(21000n)
    })
  })

  describe('from', () => {
    it('creates from bigint', async () => {
      const result = await Effect.runPromise(GasUsed.from(21000n))
      expect(typeof result).toBe('bigint')
    })

    it('creates from number', async () => {
      const result = await Effect.runPromise(GasUsed.from(21000))
      expect(typeof result).toBe('bigint')
    })

    it('fails for negative values', async () => {
      const exit = await Effect.runPromiseExit(GasUsed.from(-1n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('calculateCost', () => {
    it('calculates transaction cost', async () => {
      const result = await Effect.runPromise(GasUsed.calculateCost(21000n, 20000000000n))
      expect(result).toBe(420000000000000n)
    })
  })
})
