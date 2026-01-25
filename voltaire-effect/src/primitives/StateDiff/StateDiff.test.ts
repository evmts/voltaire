import { describe, it, expect } from 'vitest'
import * as S from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as StateDiff from './index.js'
import { Address } from '@tevm/voltaire'

describe('StateDiff', () => {
  const mockAddr = Address('0x1234567890123456789012345678901234567890')

  describe('BalanceChangeSchema', () => {
    it('validates balance change', () => {
      const change = { from: 100n, to: 200n }
      const result = S.is(StateDiff.BalanceChangeSchema)(change)
      expect(result).toBe(true)
    })

    it('validates null values', () => {
      const change = { from: null, to: 100n }
      const result = S.is(StateDiff.BalanceChangeSchema)(change)
      expect(result).toBe(true)
    })
  })

  describe('AccountDiffSchema', () => {
    it('validates account diff', () => {
      const diff = { balance: { from: 0n, to: 100n } }
      const result = S.is(StateDiff.AccountDiffSchema)(diff)
      expect(result).toBe(true)
    })

    it('validates empty diff', () => {
      const diff = {}
      const result = S.is(StateDiff.AccountDiffSchema)(diff)
      expect(result).toBe(true)
    })
  })

  describe('from', () => {
    it('creates state diff from map', async () => {
      const map = new Map([[mockAddr, { balance: { from: 0n, to: 100n } }]])
      const result = await Effect.runPromise(StateDiff.from(map as Parameters<typeof StateDiff.from>[0]))
      expect(result.accounts).toBeDefined()
    })
  })

  describe('isEmpty', () => {
    it('returns true for empty diff', async () => {
      const diff = await Effect.runPromise(StateDiff.from(new Map() as Parameters<typeof StateDiff.from>[0]))
      expect(StateDiff.isEmpty(diff)).toBe(true)
    })
  })
})
