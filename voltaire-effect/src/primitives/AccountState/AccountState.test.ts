import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as AccountState from './index.js'

describe('AccountState', () => {
  describe('AccountStateSchema', () => {
    it('decodes valid account state with all fields', () => {
      const result = Schema.decodeSync(AccountState.AccountStateSchema)({
        nonce: 5n,
        balance: 1000000000000000000n,
        codeHash: '0x' + '12'.repeat(32),
        storageRoot: '0x' + '34'.repeat(32)
      })
      expect(result.nonce).toBe(5n)
      expect(result.balance).toBe(1000000000000000000n)
      expect(result.codeHash.length).toBe(32)
      expect(result.storageRoot.length).toBe(32)
    })

    it('decodes account state with number inputs', () => {
      const result = Schema.decodeSync(AccountState.AccountStateSchema)({
        nonce: 5,
        balance: 1000,
        codeHash: 0,
        storageRoot: 0
      })
      expect(result.nonce).toBe(5n)
      expect(result.balance).toBe(1000n)
    })

    it('decodes account state with hex string inputs', () => {
      const result = Schema.decodeSync(AccountState.AccountStateSchema)({
        nonce: '0x5',
        balance: '0xde0b6b3a7640000',
        codeHash: '0x' + '00'.repeat(32),
        storageRoot: '0x' + '00'.repeat(32)
      })
      expect(result.nonce).toBe(5n)
      expect(result.balance).toBe(1000000000000000000n)
    })

    it('fails for negative nonce', () => {
      expect(() => Schema.decodeSync(AccountState.AccountStateSchema)({
        nonce: -1n,
        balance: 0n,
        codeHash: '0x' + '00'.repeat(32),
        storageRoot: '0x' + '00'.repeat(32)
      })).toThrow()
    })

    it('fails for negative balance', () => {
      expect(() => Schema.decodeSync(AccountState.AccountStateSchema)({
        nonce: 0n,
        balance: -1n,
        codeHash: '0x' + '00'.repeat(32),
        storageRoot: '0x' + '00'.repeat(32)
      })).toThrow()
    })

    it('fails for invalid codeHash length', () => {
      expect(() => Schema.decodeSync(AccountState.AccountStateSchema)({
        nonce: 0n,
        balance: 0n,
        codeHash: '0x1234',
        storageRoot: '0x' + '00'.repeat(32)
      })).toThrow()
    })
  })

  describe('from', () => {
    it('creates account state with required fields', async () => {
      const result = await Effect.runPromise(AccountState.from({
        nonce: 5n,
        balance: 1000000000000000000n
      }))
      expect(result.nonce).toBe(5n)
      expect(result.balance).toBe(1000000000000000000n)
      expect(result.codeHash).toEqual(AccountState.EMPTY_CODE_HASH)
      expect(result.storageRoot).toEqual(AccountState.EMPTY_STORAGE_ROOT)
    })

    it('creates account state with all fields', async () => {
      const codeHash = '0x' + 'ab'.repeat(32)
      const storageRoot = '0x' + 'cd'.repeat(32)
      const result = await Effect.runPromise(AccountState.from({
        nonce: 10n,
        balance: 2000000000000000000n,
        codeHash,
        storageRoot
      }))
      expect(result.nonce).toBe(10n)
      expect(result.balance).toBe(2000000000000000000n)
    })

    it('creates account state from numbers', async () => {
      const result = await Effect.runPromise(AccountState.from({
        nonce: 5,
        balance: 1000
      }))
      expect(result.nonce).toBe(5n)
      expect(result.balance).toBe(1000n)
    })

    it('fails for negative nonce', async () => {
      const exit = await Effect.runPromiseExit(AccountState.from({
        nonce: -1n,
        balance: 0n
      }))
      expect(Exit.isFailure(exit)).toBe(true)
    })

    it('fails for negative balance', async () => {
      const exit = await Effect.runPromiseExit(AccountState.from({
        nonce: 0n,
        balance: -1n
      }))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('empty', () => {
    it('creates empty account state', () => {
      const result = AccountState.empty()
      expect(result.nonce).toBe(0n)
      expect(result.balance).toBe(0n)
      expect(result.codeHash).toEqual(AccountState.EMPTY_CODE_HASH)
      expect(result.storageRoot).toEqual(AccountState.EMPTY_STORAGE_ROOT)
    })
  })

  describe('isContract', () => {
    it('returns false for EOA (empty code hash)', async () => {
      const eoa = await Effect.runPromise(AccountState.from({
        nonce: 5n,
        balance: 1000000000000000000n
      }))
      expect(AccountState.isContract(eoa)).toBe(false)
    })

    it('returns true for contract (non-empty code hash)', async () => {
      const contract = await Effect.runPromise(AccountState.from({
        nonce: 1n,
        balance: 0n,
        codeHash: '0x' + 'ab'.repeat(32)
      }))
      expect(AccountState.isContract(contract)).toBe(true)
    })
  })

  describe('isEmpty', () => {
    it('returns true for empty account', () => {
      const result = AccountState.empty()
      expect(AccountState.isEmpty(result)).toBe(true)
    })

    it('returns false for account with nonce', async () => {
      const result = await Effect.runPromise(AccountState.from({
        nonce: 1n,
        balance: 0n
      }))
      expect(AccountState.isEmpty(result)).toBe(false)
    })

    it('returns false for account with balance', async () => {
      const result = await Effect.runPromise(AccountState.from({
        nonce: 0n,
        balance: 1n
      }))
      expect(AccountState.isEmpty(result)).toBe(false)
    })

    it('returns false for contract account', async () => {
      const result = await Effect.runPromise(AccountState.from({
        nonce: 0n,
        balance: 0n,
        codeHash: '0x' + 'ab'.repeat(32)
      }))
      expect(AccountState.isEmpty(result)).toBe(false)
    })
  })
})
