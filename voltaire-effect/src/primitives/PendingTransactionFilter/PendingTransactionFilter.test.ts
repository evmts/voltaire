import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as PendingTransactionFilter from './index.js'

describe('PendingTransactionFilter', () => {
  describe('Schema', () => {
    it('decodes valid filter id string', () => {
      const result = Schema.decodeSync(PendingTransactionFilter.Schema)('0x1')
      expect(result.type).toBe('pendingTransaction')
      expect(result.filterId).toBe('0x1')
    })

    it('encodes filter back to string', () => {
      const filter = Schema.decodeSync(PendingTransactionFilter.Schema)('0xabc')
      const encoded = Schema.encodeSync(PendingTransactionFilter.Schema)(filter)
      expect(encoded).toBe('0xabc')
    })
  })

  describe('from', () => {
    it('creates filter from valid string', async () => {
      const result = await Effect.runPromise(PendingTransactionFilter.from('0x1'))
      expect(result.type).toBe('pendingTransaction')
    })

    it('creates filter from hex string', async () => {
      const result = await Effect.runPromise(PendingTransactionFilter.from('0xdef'))
      expect(result.filterId).toBe('0xdef')
    })
  })
})
