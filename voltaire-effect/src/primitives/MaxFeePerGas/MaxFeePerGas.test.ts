import { describe, it, expect } from 'vitest'
import { Uint } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as MaxFeePerGasEffect from './index.js'
import type { MaxFeePerGasType } from './MaxFeePerGasSchema.js'

const GWEI = 1_000_000_000n

describe('MaxFeePerGas', () => {
  describe('MaxFeePerGasSchema', () => {
    it('decodes bigint to MaxFeePerGasType', () => {
      const result = Schema.decodeSync(MaxFeePerGasEffect.MaxFeePerGasSchema)(100_000_000_000n)
      expect(typeof result).toBe('bigint')
      expect(result).toBe(100_000_000_000n)
    })

    it('decodes number to MaxFeePerGasType', () => {
      const result = Schema.decodeSync(MaxFeePerGasEffect.MaxFeePerGasSchema)(100000000000)
      expect(typeof result).toBe('bigint')
    })

    it('decodes hex string to MaxFeePerGasType', () => {
      const result = Schema.decodeSync(MaxFeePerGasEffect.MaxFeePerGasSchema)('0x174876e800')
      expect(typeof result).toBe('bigint')
      expect(result).toBe(100_000_000_000n)
    })

    it('fails for negative values', () => {
      expect(() => Schema.decodeSync(MaxFeePerGasEffect.MaxFeePerGasSchema)(-1n)).toThrow()
    })

    it('encodes MaxFeePerGasType back to bigint', () => {
      const maxFee = Uint.from(100_000_000_000n) as unknown as MaxFeePerGasType
      const result = Schema.encodeSync(MaxFeePerGasEffect.MaxFeePerGasSchema)(maxFee)
      expect(result).toBe(100_000_000_000n)
    })
  })

  describe('MaxFeePerGasFromGweiSchema', () => {
    it('decodes gwei number to wei', () => {
      const result = Schema.decodeSync(MaxFeePerGasEffect.MaxFeePerGasFromGweiSchema)(100)
      expect(result).toBe(100n * GWEI)
    })

    it('decodes gwei bigint to wei', () => {
      const result = Schema.decodeSync(MaxFeePerGasEffect.MaxFeePerGasFromGweiSchema)(500n)
      expect(result).toBe(500n * GWEI)
    })

    it('encodes wei back to gwei', () => {
      const maxFee = (100n * GWEI) as MaxFeePerGasType
      const result = Schema.encodeSync(MaxFeePerGasEffect.MaxFeePerGasFromGweiSchema)(maxFee)
      expect(result).toBe(100n)
    })
  })

  describe('from', () => {
    it('creates MaxFeePerGas from bigint', async () => {
      const result = await Effect.runPromise(MaxFeePerGasEffect.from(100_000_000_000n))
      expect(typeof result).toBe('bigint')
    })

    it('creates MaxFeePerGas from number', async () => {
      const result = await Effect.runPromise(MaxFeePerGasEffect.from(100000000000))
      expect(typeof result).toBe('bigint')
    })

    it('creates MaxFeePerGas from hex string', async () => {
      const result = await Effect.runPromise(MaxFeePerGasEffect.from('0x174876e800'))
      expect(result).toBe(100_000_000_000n)
    })

    it('fails for negative values', async () => {
      const exit = await Effect.runPromiseExit(MaxFeePerGasEffect.from(-1n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('fromGwei', () => {
    it('creates MaxFeePerGas from gwei number', async () => {
      const result = await Effect.runPromise(MaxFeePerGasEffect.fromGwei(100))
      expect(result).toBe(100n * GWEI)
    })

    it('creates MaxFeePerGas from gwei bigint', async () => {
      const result = await Effect.runPromise(MaxFeePerGasEffect.fromGwei(500n))
      expect(result).toBe(500n * GWEI)
    })

    it('fails for negative gwei', async () => {
      const exit = await Effect.runPromiseExit(MaxFeePerGasEffect.fromGwei(-1n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('toGwei', () => {
    it('converts wei to gwei', () => {
      const maxFee = (100n * GWEI) as MaxFeePerGasType
      expect(MaxFeePerGasEffect.toGwei(maxFee)).toBe(100n)
    })

    it('handles fractional gwei (truncates)', () => {
      const maxFee = (100_500_000_000n) as MaxFeePerGasType
      expect(MaxFeePerGasEffect.toGwei(maxFee)).toBe(100n)
    })
  })
})
