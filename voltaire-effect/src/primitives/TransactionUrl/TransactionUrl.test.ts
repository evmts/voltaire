import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as TransactionUrl from './index.js'

describe('TransactionUrl', () => {
  const validUrl = 'ethereum:0x1234567890123456789012345678901234567890'

  describe('Schema', () => {
    it('decodes valid URL', () => {
      const result = Schema.decodeSync(TransactionUrl.Schema)(validUrl)
      expect(result).toBe(validUrl)
    })

    it('fails for invalid URL', () => {
      expect(() => Schema.decodeSync(TransactionUrl.Schema)('invalid')).toThrow()
    })

    it('encodes back to string', () => {
      const decoded = Schema.decodeSync(TransactionUrl.Schema)(validUrl)
      const encoded = Schema.encodeSync(TransactionUrl.Schema)(decoded)
      expect(encoded).toBe(validUrl)
    })
  })

  describe('from', () => {
    it('creates from valid URL string', async () => {
      const result = await Effect.runPromise(TransactionUrl.from(validUrl))
      expect(result).toBe(validUrl)
    })

    it('fails for invalid URL', async () => {
      const exit = await Effect.runPromiseExit(TransactionUrl.from('not-valid'))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('parse', () => {
    it('parses URL to components', async () => {
      const url = await Effect.runPromise(TransactionUrl.from(validUrl))
      const parsed = TransactionUrl.parse(url)
      expect(parsed.target).toBeDefined()
    })
  })
})
