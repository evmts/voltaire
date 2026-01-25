import { describe, it, expect } from 'vitest'
import { Uint } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as NonceEffect from './index.js'
import type { NonceType } from './NonceSchema.js'

describe('Nonce', () => {
  describe('NonceSchema', () => {
    it('decodes bigint to NonceType', () => {
      const result = Schema.decodeSync(NonceEffect.NonceSchema)(0n)
      expect(typeof result).toBe('bigint')
    })

    it('decodes number to NonceType', () => {
      const result = Schema.decodeSync(NonceEffect.NonceSchema)(42)
      expect(typeof result).toBe('bigint')
    })

    it('decodes hex string to NonceType', () => {
      const result = Schema.decodeSync(NonceEffect.NonceSchema)('0x2a')
      expect(typeof result).toBe('bigint')
      expect(result).toBe(42n)
    })

    it('fails for negative values', () => {
      expect(() => Schema.decodeSync(NonceEffect.NonceSchema)(-1n)).toThrow()
    })

    it('encodes NonceType back to bigint', () => {
      const nonce = Uint.from(42) as unknown as NonceType
      const result = Schema.encodeSync(NonceEffect.NonceSchema)(nonce)
      expect(result).toBe(42n)
    })
  })

  describe('from', () => {
    it('creates Nonce from bigint', async () => {
      const result = await Effect.runPromise(NonceEffect.from(0n))
      expect(typeof result).toBe('bigint')
    })

    it('creates Nonce from number', async () => {
      const result = await Effect.runPromise(NonceEffect.from(42))
      expect(typeof result).toBe('bigint')
    })

    it('creates Nonce from hex string', async () => {
      const result = await Effect.runPromise(NonceEffect.from('0x2a'))
      expect(result).toBe(42n)
    })

    it('fails for negative values', async () => {
      const exit = await Effect.runPromiseExit(NonceEffect.from(-1n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
