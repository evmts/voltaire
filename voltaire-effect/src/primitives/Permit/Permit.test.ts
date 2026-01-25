import { describe, it, expect } from 'vitest'
import * as S from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Permit from './index.js'
import { Address } from '@tevm/voltaire'

describe('Permit', () => {
  const mockAddr = Address('0x1234567890123456789012345678901234567890')

  describe('Schema', () => {
    it('validates valid permit', () => {
      const permit = {
        owner: mockAddr,
        spender: mockAddr,
        value: 1000n,
        nonce: 0n,
        deadline: 9999999999n,
      }
      const result = S.is(Permit.PermitTypeSchema)(permit)
      expect(result).toBe(true)
    })

    it('rejects invalid permit', () => {
      const invalid = { foo: 'bar' }
      const result = S.is(Permit.PermitTypeSchema)(invalid)
      expect(result).toBe(false)
    })
  })

  describe('from', () => {
    it('creates permit from input', async () => {
      const result = await Effect.runPromise(Permit.from({
        owner: '0x1234567890123456789012345678901234567890',
        spender: '0x1234567890123456789012345678901234567890',
        value: 1000n,
        nonce: 0n,
        deadline: 9999999999n,
      }))
      expect(result.value).toBeDefined()
    })
  })
})
