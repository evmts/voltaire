import { describe, it, expect } from 'vitest'
import { Gas } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as GasPriceEffect from './index.js'

describe('GasPrice', () => {
  describe('GasPriceSchema', () => {
    it('decodes bigint to GasPriceType', () => {
      const result = Schema.decodeSync(GasPriceEffect.GasPriceSchema)(1000000000n)
      expect(typeof result).toBe('bigint')
    })

    it('decodes number to GasPriceType', () => {
      const result = Schema.decodeSync(GasPriceEffect.GasPriceSchema)(1000000000)
      expect(typeof result).toBe('bigint')
    })

    it('decodes hex string to GasPriceType', () => {
      const result = Schema.decodeSync(GasPriceEffect.GasPriceSchema)('0x3b9aca00')
      expect(typeof result).toBe('bigint')
      expect(result).toBe(1000000000n)
    })

    it('fails for negative values', () => {
      expect(() => Schema.decodeSync(GasPriceEffect.GasPriceSchema)(-1n)).toThrow()
    })

    it('encodes GasPriceType back to bigint', () => {
      const gasPrice = Gas.GasPrice.from(1000000000n)
      const result = Schema.encodeSync(GasPriceEffect.GasPriceSchema)(gasPrice)
      expect(result).toBe(1000000000n)
    })
  })

  describe('GasPriceFromGweiSchema', () => {
    it('decodes gwei number to GasPriceType', () => {
      const result = Schema.decodeSync(GasPriceEffect.GasPriceFromGweiSchema)(1)
      expect(typeof result).toBe('bigint')
      expect(result).toBe(1000000000n)
    })

    it('decodes gwei bigint to GasPriceType', () => {
      const result = Schema.decodeSync(GasPriceEffect.GasPriceFromGweiSchema)(1n)
      expect(typeof result).toBe('bigint')
      expect(result).toBe(1000000000n)
    })
  })

  describe('from', () => {
    it('creates GasPrice from bigint', async () => {
      const result = await Effect.runPromise(GasPriceEffect.from(1000000000n))
      expect(typeof result).toBe('bigint')
    })

    it('creates GasPrice from number', async () => {
      const result = await Effect.runPromise(GasPriceEffect.from(1000000000))
      expect(typeof result).toBe('bigint')
    })

    it('creates GasPrice from hex string', async () => {
      const result = await Effect.runPromise(GasPriceEffect.from('0x3b9aca00'))
      expect(result).toBe(1000000000n)
    })

    it('fails for negative values', async () => {
      const exit = await Effect.runPromiseExit(GasPriceEffect.from(-1n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('fromGwei', () => {
    it('creates GasPrice from gwei number', async () => {
      const result = await Effect.runPromise(GasPriceEffect.fromGwei(1))
      expect(result).toBe(1000000000n)
    })

    it('creates GasPrice from gwei bigint', async () => {
      const result = await Effect.runPromise(GasPriceEffect.fromGwei(10n))
      expect(result).toBe(10000000000n)
    })
  })
})
