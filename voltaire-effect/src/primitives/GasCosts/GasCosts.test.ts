import { describe, it, expect } from 'vitest'
import { GAS_COSTS, BLOCK_GAS_LIMITS, TRANSACTION_COSTS } from './index.js'

describe('GasCosts', () => {
  describe('GAS_COSTS', () => {
    it('exports TRANSACTION cost', () => {
      expect(GAS_COSTS.TRANSACTION).toBe(21000n)
    })

    it('exports CREATE cost', () => {
      expect(GAS_COSTS.CREATE).toBe(32000n)
    })

    it('exports SLOAD cost', () => {
      expect(GAS_COSTS.SLOAD).toBe(2100n)
    })

    it('exports SSTORE_SET cost', () => {
      expect(GAS_COSTS.SSTORE_SET).toBe(20000n)
    })
  })

  describe('BLOCK_GAS_LIMITS', () => {
    it('exports MAINNET limit', () => {
      expect(BLOCK_GAS_LIMITS.MAINNET).toBe(30000000n)
    })

    it('exports MINIMUM limit', () => {
      expect(BLOCK_GAS_LIMITS.MINIMUM).toBe(5000n)
    })
  })

  describe('TRANSACTION_COSTS', () => {
    it('exports SIMPLE_TRANSFER cost', () => {
      expect(TRANSACTION_COSTS.SIMPLE_TRANSFER).toBe(21000n)
    })

    it('exports ERC20_TRANSFER cost', () => {
      expect(TRANSACTION_COSTS.ERC20_TRANSFER).toBe(65000n)
    })

    it('exports CONTRACT_DEPLOY cost', () => {
      expect(TRANSACTION_COSTS.CONTRACT_DEPLOY).toBe(32000n)
    })
  })
})
