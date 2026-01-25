import { describe, it, expect } from 'vitest'
import { GasEstimate as VoltaireGasEstimate } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as GasEstimateEffect from './index.js'

describe('GasEstimate', () => {
  describe('GasEstimateSchema', () => {
    it('decodes bigint to GasEstimateType', () => {
      const result = Schema.decodeSync(GasEstimateEffect.GasEstimateSchema)(21000n)
      expect(typeof result).toBe('bigint')
    })

    it('decodes number to GasEstimateType', () => {
      const result = Schema.decodeSync(GasEstimateEffect.GasEstimateSchema)(21000)
      expect(typeof result).toBe('bigint')
    })

    it('decodes hex string to GasEstimateType', () => {
      const result = Schema.decodeSync(GasEstimateEffect.GasEstimateSchema)('0x5208')
      expect(typeof result).toBe('bigint')
      expect(result).toBe(21000n)
    })

    it('fails for negative values', () => {
      expect(() => Schema.decodeSync(GasEstimateEffect.GasEstimateSchema)(-1n)).toThrow()
    })

    it('encodes GasEstimateType back to bigint', () => {
      const gasEstimate = VoltaireGasEstimate.GasEstimate.from(21000n)
      const result = Schema.encodeSync(GasEstimateEffect.GasEstimateSchema)(gasEstimate)
      expect(result).toBe(21000n)
    })
  })

  describe('from', () => {
    it('creates GasEstimate from bigint', async () => {
      const result = await Effect.runPromise(GasEstimateEffect.from(21000n))
      expect(typeof result).toBe('bigint')
    })

    it('creates GasEstimate from number', async () => {
      const result = await Effect.runPromise(GasEstimateEffect.from(21000))
      expect(typeof result).toBe('bigint')
    })

    it('creates GasEstimate from hex string', async () => {
      const result = await Effect.runPromise(GasEstimateEffect.from('0x5208'))
      expect(result).toBe(21000n)
    })

    it('fails for negative values', async () => {
      const exit = await Effect.runPromiseExit(GasEstimateEffect.from(-1n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('withBuffer', () => {
    it('adds buffer percentage to estimate', async () => {
      const estimate = VoltaireGasEstimate.GasEstimate.from(100000n)
      const result = await Effect.runPromise(GasEstimateEffect.withBuffer(estimate, 20))
      expect(result).toBe(120000n)
    })
  })

  describe('toGasLimit', () => {
    it('converts GasEstimate to GasLimit', async () => {
      const estimate = VoltaireGasEstimate.GasEstimate.from(21000n)
      const result = await Effect.runPromise(GasEstimateEffect.toGasLimit(estimate))
      expect(typeof result).toBe('bigint')
      expect(result).toBe(21000n)
    })
  })
})
