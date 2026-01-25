import { describe, it, expect } from 'vitest'
import * as S from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as RevertReason from './index.js'

describe('RevertReason', () => {
  describe('RevertReasonTypeSchema', () => {
    it('validates Error type', () => {
      const error = { type: 'Error' as const, message: 'Something went wrong' }
      const result = S.is(RevertReason.RevertReasonTypeSchema)(error)
      expect(result).toBe(true)
    })

    it('validates Panic type', () => {
      const panic = { type: 'Panic' as const, code: 1, description: 'Assertion failed' }
      const result = S.is(RevertReason.RevertReasonTypeSchema)(panic)
      expect(result).toBe(true)
    })

    it('validates Custom type', () => {
      const custom = { type: 'Custom' as const, selector: '0x12345678', data: new Uint8Array([1, 2, 3]) }
      const result = S.is(RevertReason.RevertReasonTypeSchema)(custom)
      expect(result).toBe(true)
    })

    it('validates Unknown type', () => {
      const unknown = { type: 'Unknown' as const, data: new Uint8Array([1, 2, 3]) }
      const result = S.is(RevertReason.RevertReasonTypeSchema)(unknown)
      expect(result).toBe(true)
    })

    it('rejects invalid type', () => {
      const invalid = { type: 'Invalid', foo: 'bar' }
      const result = S.is(RevertReason.RevertReasonTypeSchema)(invalid)
      expect(result).toBe(false)
    })
  })

  describe('from', () => {
    it('creates from empty bytes', async () => {
      const result = await Effect.runPromise(RevertReason.from(new Uint8Array(0)))
      expect(result.type).toBe('Unknown')
    })
  })

  describe('toString', () => {
    it('converts Error to string', () => {
      const error = { type: 'Error' as const, message: 'Test error' }
      const result = RevertReason.toString(error)
      expect(result).toContain('Test error')
    })
  })
})
