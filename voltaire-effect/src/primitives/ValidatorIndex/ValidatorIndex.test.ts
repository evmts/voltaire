import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as ValidatorIndex from './index.js'

describe('ValidatorIndex', () => {
  describe('Schema', () => {
    it('decodes valid number', () => {
      const result = Schema.decodeSync(ValidatorIndex.Schema)(0)
      expect(result).toBe(0)
    })

    it('decodes positive index', () => {
      const result = Schema.decodeSync(ValidatorIndex.Schema)(12345)
      expect(result).toBe(12345)
    })

    it('fails for negative number', () => {
      expect(() => Schema.decodeSync(ValidatorIndex.Schema)(-1)).toThrow()
    })

    it('encodes back to number', () => {
      const decoded = Schema.decodeSync(ValidatorIndex.Schema)(42)
      const encoded = Schema.encodeSync(ValidatorIndex.Schema)(decoded)
      expect(encoded).toBe(42)
    })
  })

  describe('from', () => {
    it('creates from number', async () => {
      const result = await Effect.runPromise(ValidatorIndex.from(42))
      expect(result).toBe(42)
    })

    it('creates from bigint', async () => {
      const result = await Effect.runPromise(ValidatorIndex.from(42n))
      expect(result).toBe(42)
    })

    it('fails for negative', async () => {
      const exit = await Effect.runPromiseExit(ValidatorIndex.from(-1))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('conversions', () => {
    it('toNumber works', async () => {
      const value = await Effect.runPromise(ValidatorIndex.from(42))
      expect(ValidatorIndex.toNumber(value)).toBe(42)
    })

    it('equals works', async () => {
      const a = await Effect.runPromise(ValidatorIndex.from(42))
      const b = await Effect.runPromise(ValidatorIndex.from(42))
      expect(ValidatorIndex.equals(a, b)).toBe(true)
    })
  })
})
