import { describe, it, expect } from 'vitest'
import { Uint } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as MaxPriorityFeePerGasEffect from './index.js'
import type { MaxPriorityFeePerGasType } from './MaxPriorityFeePerGasSchema.js'

const GWEI = 1_000_000_000n

describe('MaxPriorityFeePerGas', () => {
  describe('MaxPriorityFeePerGasSchema', () => {
    it('decodes bigint to MaxPriorityFeePerGasType', () => {
      const result = Schema.decodeSync(MaxPriorityFeePerGasEffect.MaxPriorityFeePerGasSchema)(2_000_000_000n)
      expect(typeof result).toBe('bigint')
      expect(result).toBe(2_000_000_000n)
    })

    it('decodes number to MaxPriorityFeePerGasType', () => {
      const result = Schema.decodeSync(MaxPriorityFeePerGasEffect.MaxPriorityFeePerGasSchema)(2000000000)
      expect(typeof result).toBe('bigint')
    })

    it('decodes hex string to MaxPriorityFeePerGasType', () => {
      const result = Schema.decodeSync(MaxPriorityFeePerGasEffect.MaxPriorityFeePerGasSchema)('0x77359400')
      expect(typeof result).toBe('bigint')
      expect(result).toBe(2_000_000_000n)
    })

    it('fails for negative values', () => {
      expect(() => Schema.decodeSync(MaxPriorityFeePerGasEffect.MaxPriorityFeePerGasSchema)(-1n)).toThrow()
    })

    it('encodes MaxPriorityFeePerGasType back to bigint', () => {
      const maxPriorityFee = Uint.from(2_000_000_000n) as unknown as MaxPriorityFeePerGasType
      const result = Schema.encodeSync(MaxPriorityFeePerGasEffect.MaxPriorityFeePerGasSchema)(maxPriorityFee)
      expect(result).toBe(2_000_000_000n)
    })
  })

  describe('MaxPriorityFeePerGasFromGweiSchema', () => {
    it('decodes gwei number to wei', () => {
      const result = Schema.decodeSync(MaxPriorityFeePerGasEffect.MaxPriorityFeePerGasFromGweiSchema)(2)
      expect(result).toBe(2n * GWEI)
    })

    it('decodes gwei bigint to wei', () => {
      const result = Schema.decodeSync(MaxPriorityFeePerGasEffect.MaxPriorityFeePerGasFromGweiSchema)(5n)
      expect(result).toBe(5n * GWEI)
    })

    it('encodes wei back to gwei', () => {
      const maxPriorityFee = (2n * GWEI) as MaxPriorityFeePerGasType
      const result = Schema.encodeSync(MaxPriorityFeePerGasEffect.MaxPriorityFeePerGasFromGweiSchema)(maxPriorityFee)
      expect(result).toBe(2n)
    })
  })

  describe('from', () => {
    it('creates MaxPriorityFeePerGas from bigint', async () => {
      const result = await Effect.runPromise(MaxPriorityFeePerGasEffect.from(2_000_000_000n))
      expect(typeof result).toBe('bigint')
    })

    it('creates MaxPriorityFeePerGas from number', async () => {
      const result = await Effect.runPromise(MaxPriorityFeePerGasEffect.from(2000000000))
      expect(typeof result).toBe('bigint')
    })

    it('creates MaxPriorityFeePerGas from hex string', async () => {
      const result = await Effect.runPromise(MaxPriorityFeePerGasEffect.from('0x77359400'))
      expect(result).toBe(2_000_000_000n)
    })

    it('fails for negative values', async () => {
      const exit = await Effect.runPromiseExit(MaxPriorityFeePerGasEffect.from(-1n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('fromGwei', () => {
    it('creates MaxPriorityFeePerGas from gwei number', async () => {
      const result = await Effect.runPromise(MaxPriorityFeePerGasEffect.fromGwei(2))
      expect(result).toBe(2n * GWEI)
    })

    it('creates MaxPriorityFeePerGas from gwei bigint', async () => {
      const result = await Effect.runPromise(MaxPriorityFeePerGasEffect.fromGwei(5n))
      expect(result).toBe(5n * GWEI)
    })

    it('fails for negative gwei', async () => {
      const exit = await Effect.runPromiseExit(MaxPriorityFeePerGasEffect.fromGwei(-1n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('toGwei', () => {
    it('converts wei to gwei', () => {
      const maxPriorityFee = (2n * GWEI) as MaxPriorityFeePerGasType
      expect(MaxPriorityFeePerGasEffect.toGwei(maxPriorityFee)).toBe(2n)
    })

    it('handles fractional gwei (truncates)', () => {
      const maxPriorityFee = (2_500_000_000n) as MaxPriorityFeePerGasType
      expect(MaxPriorityFeePerGasEffect.toGwei(maxPriorityFee)).toBe(2n)
    })

    it('handles zero', () => {
      const maxPriorityFee = 0n as MaxPriorityFeePerGasType
      expect(MaxPriorityFeePerGasEffect.toGwei(maxPriorityFee)).toBe(0n)
    })
  })
})
