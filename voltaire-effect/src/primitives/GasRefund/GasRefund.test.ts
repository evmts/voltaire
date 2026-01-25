import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as GasRefund from './index.js'

describe('GasRefund', () => {
  describe('Schema', () => {
    it('decodes bigint', () => {
      const result = Schema.decodeSync(GasRefund.Schema)(15000n)
      expect(typeof result).toBe('bigint')
    })

    it('decodes number', () => {
      const result = Schema.decodeSync(GasRefund.Schema)(15000)
      expect(typeof result).toBe('bigint')
    })

    it('decodes hex string', () => {
      const result = Schema.decodeSync(GasRefund.Schema)('0x3a98')
      expect(typeof result).toBe('bigint')
    })

    it('encodes back to bigint', () => {
      const decoded = Schema.decodeSync(GasRefund.Schema)(1000n)
      const encoded = Schema.encodeSync(GasRefund.Schema)(decoded)
      expect(encoded).toBe(1000n)
    })
  })

  describe('from', () => {
    it('creates from bigint', async () => {
      const result = await Effect.runPromise(GasRefund.from(5000n))
      expect(typeof result).toBe('bigint')
    })

    it('creates from number', async () => {
      const result = await Effect.runPromise(GasRefund.from(5000))
      expect(typeof result).toBe('bigint')
    })

    it('fails for negative values', async () => {
      const exit = await Effect.runPromiseExit(GasRefund.from(-1n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('cappedRefund', () => {
    it('caps refund to gasUsed / 5', async () => {
      const result = await Effect.runPromise(GasRefund.cappedRefund(100000n, 100000n))
      expect(result <= 100000n / 5n).toBe(true)
    })
  })
})
