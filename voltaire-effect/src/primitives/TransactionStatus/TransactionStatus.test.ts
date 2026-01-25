import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import { Uint } from '@tevm/voltaire'
import * as TransactionStatus from './index.js'

describe('TransactionStatus', () => {
  describe('Schema', () => {
    it('decodes pending', () => {
      const result = Schema.decodeSync(TransactionStatus.Schema)({ type: 'pending' })
      expect(result.type).toBe('pending')
    })

    it('decodes success', () => {
      const gasUsed = Uint.from(21000n)
      const result = Schema.decodeSync(TransactionStatus.Schema)({ type: 'success', gasUsed })
      expect(result.type).toBe('success')
    })

    it('decodes failed', () => {
      const result = Schema.decodeSync(TransactionStatus.Schema)({ type: 'failed' })
      expect(result.type).toBe('failed')
    })

    it('fails for invalid status', () => {
      expect(() => Schema.decodeSync(TransactionStatus.Schema)({ type: 'invalid' })).toThrow()
    })
  })

  describe('constructors', () => {
    it('pending creates pending status', () => {
      const status = TransactionStatus.pending()
      expect(TransactionStatus.isPending(status)).toBe(true)
    })

    it('success creates success status', () => {
      const gasUsed = Uint.from(21000n)
      const status = TransactionStatus.success(gasUsed)
      expect(TransactionStatus.isSuccess(status)).toBe(true)
    })

    it('failed creates failed status', () => {
      const status = TransactionStatus.failed()
      expect(TransactionStatus.isFailed(status)).toBe(true)
    })

    it('failed with reason', () => {
      const status = TransactionStatus.failed('out of gas')
      expect(TransactionStatus.isFailed(status)).toBe(true)
    })
  })

  describe('predicates', () => {
    it('isPending returns false for success', () => {
      const gasUsed = Uint.from(21000n)
      expect(TransactionStatus.isPending(TransactionStatus.success(gasUsed))).toBe(false)
    })

    it('isSuccess returns false for failed', () => {
      expect(TransactionStatus.isSuccess(TransactionStatus.failed())).toBe(false)
    })

    it('isFailed returns false for pending', () => {
      expect(TransactionStatus.isFailed(TransactionStatus.pending())).toBe(false)
    })
  })
})
