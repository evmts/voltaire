import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Withdrawal from './index.js'

describe('Withdrawal', () => {
  const validWithdrawalInput = {
    index: 1n,
    validatorIndex: 12345,
    address: '0x' + '00'.repeat(20),
    amount: 1000000000n
  }

  describe('from', () => {
    it('creates withdrawal from valid input', async () => {
      const result = await Effect.runPromise(Withdrawal.from(validWithdrawalInput))
      expect(result).toBeDefined()
      expect(result.validatorIndex).toBeDefined()
    })

    it('fails for invalid input', async () => {
      const exit = await Effect.runPromiseExit(Withdrawal.from({} as Parameters<typeof Withdrawal.from>[0]))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('equals', () => {
    it('compares two equal withdrawals', async () => {
      const a = await Effect.runPromise(Withdrawal.from(validWithdrawalInput))
      const b = await Effect.runPromise(Withdrawal.from(validWithdrawalInput))
      expect(Withdrawal.equals(a, b)).toBe(true)
    })

    it('compares two different withdrawals', async () => {
      const a = await Effect.runPromise(Withdrawal.from(validWithdrawalInput))
      const b = await Effect.runPromise(Withdrawal.from({
        ...validWithdrawalInput,
        index: 2n
      }))
      expect(Withdrawal.equals(a, b)).toBe(false)
    })
  })
})
