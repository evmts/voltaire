import { describe, it, expect } from 'vitest'
import { Uint } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as GasEffect from './index.js'
import type { GasType } from './GasSchema.js'

describe('Gas', () => {
  describe('GasSchema', () => {
    it('decodes bigint to GasType', () => {
      const result = Schema.decodeSync(GasEffect.GasSchema)(21000n)
      expect(typeof result).toBe('bigint')
    })

    it('decodes number to GasType', () => {
      const result = Schema.decodeSync(GasEffect.GasSchema)(21000)
      expect(typeof result).toBe('bigint')
    })

    it('decodes hex string to GasType', () => {
      const result = Schema.decodeSync(GasEffect.GasSchema)('0x5208')
      expect(typeof result).toBe('bigint')
      expect(result).toBe(21000n)
    })

    it('fails for negative values', () => {
      expect(() => Schema.decodeSync(GasEffect.GasSchema)(-1n)).toThrow()
    })

    it('encodes GasType back to bigint', () => {
      const gas = Uint.from(21000) as unknown as GasType
      const result = Schema.encodeSync(GasEffect.GasSchema)(gas)
      expect(result).toBe(21000n)
    })
  })

  describe('from', () => {
    it('creates Gas from bigint', async () => {
      const result = await Effect.runPromise(GasEffect.from(21000n))
      expect(typeof result).toBe('bigint')
    })

    it('creates Gas from number', async () => {
      const result = await Effect.runPromise(GasEffect.from(21000))
      expect(typeof result).toBe('bigint')
    })

    it('creates Gas from hex string', async () => {
      const result = await Effect.runPromise(GasEffect.from('0x5208'))
      expect(result).toBe(21000n)
    })

    it('fails for negative values', async () => {
      const exit = await Effect.runPromiseExit(GasEffect.from(-1n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
