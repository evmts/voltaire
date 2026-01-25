import { describe, it, expect } from 'vitest'
import { Uint } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as BaseFeePerGasEffect from './index.js'
import type { BaseFeePerGasType } from './BaseFeePerGasSchema.js'

const GWEI = 1_000_000_000n

describe('BaseFeePerGas', () => {
  describe('BaseFeePerGasSchema', () => {
    it('decodes bigint to BaseFeePerGasType', () => {
      const result = Schema.decodeSync(BaseFeePerGasEffect.BaseFeePerGasSchema)(25_000_000_000n)
      expect(typeof result).toBe('bigint')
      expect(result).toBe(25_000_000_000n)
    })

    it('decodes number to BaseFeePerGasType', () => {
      const result = Schema.decodeSync(BaseFeePerGasEffect.BaseFeePerGasSchema)(25000000000)
      expect(typeof result).toBe('bigint')
    })

    it('decodes hex string to BaseFeePerGasType', () => {
      const result = Schema.decodeSync(BaseFeePerGasEffect.BaseFeePerGasSchema)('0x5d21dba00')
      expect(typeof result).toBe('bigint')
      expect(result).toBe(25_000_000_000n)
    })

    it('fails for negative values', () => {
      expect(() => Schema.decodeSync(BaseFeePerGasEffect.BaseFeePerGasSchema)(-1n)).toThrow()
    })

    it('encodes BaseFeePerGasType back to bigint', () => {
      const baseFee = Uint.from(25_000_000_000n) as unknown as BaseFeePerGasType
      const result = Schema.encodeSync(BaseFeePerGasEffect.BaseFeePerGasSchema)(baseFee)
      expect(result).toBe(25_000_000_000n)
    })
  })

  describe('BaseFeePerGasFromGweiSchema', () => {
    it('decodes gwei number to wei', () => {
      const result = Schema.decodeSync(BaseFeePerGasEffect.BaseFeePerGasFromGweiSchema)(25)
      expect(result).toBe(25n * GWEI)
    })

    it('decodes gwei bigint to wei', () => {
      const result = Schema.decodeSync(BaseFeePerGasEffect.BaseFeePerGasFromGweiSchema)(100n)
      expect(result).toBe(100n * GWEI)
    })

    it('encodes wei back to gwei', () => {
      const baseFee = (25n * GWEI) as BaseFeePerGasType
      const result = Schema.encodeSync(BaseFeePerGasEffect.BaseFeePerGasFromGweiSchema)(baseFee)
      expect(result).toBe(25n)
    })
  })

  describe('from', () => {
    it('creates BaseFeePerGas from bigint', async () => {
      const result = await Effect.runPromise(BaseFeePerGasEffect.from(25_000_000_000n))
      expect(typeof result).toBe('bigint')
    })

    it('creates BaseFeePerGas from number', async () => {
      const result = await Effect.runPromise(BaseFeePerGasEffect.from(25000000000))
      expect(typeof result).toBe('bigint')
    })

    it('creates BaseFeePerGas from hex string', async () => {
      const result = await Effect.runPromise(BaseFeePerGasEffect.from('0x5d21dba00'))
      expect(result).toBe(25_000_000_000n)
    })

    it('fails for negative values', async () => {
      const exit = await Effect.runPromiseExit(BaseFeePerGasEffect.from(-1n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('fromGwei', () => {
    it('creates BaseFeePerGas from gwei number', async () => {
      const result = await Effect.runPromise(BaseFeePerGasEffect.fromGwei(25))
      expect(result).toBe(25n * GWEI)
    })

    it('creates BaseFeePerGas from gwei bigint', async () => {
      const result = await Effect.runPromise(BaseFeePerGasEffect.fromGwei(100n))
      expect(result).toBe(100n * GWEI)
    })

    it('fails for negative gwei', async () => {
      const exit = await Effect.runPromiseExit(BaseFeePerGasEffect.fromGwei(-1n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('toGwei', () => {
    it('converts wei to gwei', () => {
      const baseFee = (25n * GWEI) as BaseFeePerGasType
      expect(BaseFeePerGasEffect.toGwei(baseFee)).toBe(25n)
    })

    it('handles fractional gwei (truncates)', () => {
      const baseFee = (25_500_000_000n) as BaseFeePerGasType
      expect(BaseFeePerGasEffect.toGwei(baseFee)).toBe(25n)
    })
  })
})
