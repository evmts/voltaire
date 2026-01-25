import { describe, it, expect } from 'vitest'
import { Uint256 } from '@tevm/voltaire/Uint'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as U256 from './index.js'

describe('U256', () => {
  describe('U256Schema', () => {
    it('decodes bigint to U256', () => {
      const result = Schema.decodeSync(U256.U256Schema)(100n)
      expect(typeof result).toBe('bigint')
    })

    it('decodes number to U256', () => {
      const result = Schema.decodeSync(U256.U256Schema)(42)
      expect(typeof result).toBe('bigint')
    })

    it('fails for negative values', () => {
      expect(() => Schema.decodeSync(U256.U256Schema)(-1n)).toThrow()
    })
  })

  describe('U256FromHexSchema', () => {
    it('decodes hex string to U256', () => {
      const result = Schema.decodeSync(U256.U256FromHexSchema)('0xff')
      expect(result).toBe(255n)
    })
  })

  describe('from', () => {
    it('creates U256 from bigint', async () => {
      const result = await Effect.runPromise(U256.from(100n))
      expect(typeof result).toBe('bigint')
    })

    it('fails for negative values', async () => {
      const exit = await Effect.runPromiseExit(U256.from(-1n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
