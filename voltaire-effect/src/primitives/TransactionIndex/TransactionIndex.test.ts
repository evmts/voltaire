import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as TransactionIndex from './index.js'

describe('TransactionIndex', () => {
  describe('Schema', () => {
    it('decodes valid number', () => {
      const result = Schema.decodeSync(TransactionIndex.Schema)(0)
      expect(result).toBe(0)
    })

    it('decodes positive index', () => {
      const result = Schema.decodeSync(TransactionIndex.Schema)(42)
      expect(result).toBe(42)
    })

    it('fails for negative number', () => {
      expect(() => Schema.decodeSync(TransactionIndex.Schema)(-1)).toThrow()
    })

    it('encodes back to number', () => {
      const decoded = Schema.decodeSync(TransactionIndex.Schema)(42)
      const encoded = Schema.encodeSync(TransactionIndex.Schema)(decoded)
      expect(encoded).toBe(42)
    })
  })

  describe('from', () => {
    it('creates from number', async () => {
      const result = await Effect.runPromise(TransactionIndex.from(42))
      expect(result).toBe(42)
    })

    it('creates from bigint', async () => {
      const result = await Effect.runPromise(TransactionIndex.from(42n))
      expect(Number(result)).toBe(42)
    })

    it('fails for negative', async () => {
      const exit = await Effect.runPromiseExit(TransactionIndex.from(-1))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('conversions', () => {
    it('toNumber works', async () => {
      const value = await Effect.runPromise(TransactionIndex.from(42))
      expect(TransactionIndex.toNumber(value)).toBe(42)
    })

    it('equals works', async () => {
      const a = await Effect.runPromise(TransactionIndex.from(42))
      const b = await Effect.runPromise(TransactionIndex.from(42))
      expect(TransactionIndex.equals(a, b)).toBe(true)
    })
  })
})
