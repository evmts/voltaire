import { describe, it, expect } from 'vitest'
import * as GasConstants from './index.js'

describe('GasConstants', () => {
  describe('constants', () => {
    it('exports GAS_ZERO', () => {
      expect(GasConstants.GAS_ZERO).toBe(0n)
    })

    it('exports GAS_BASE', () => {
      expect(typeof GasConstants.GAS_BASE).toBe('bigint')
    })

    it('exports GAS_TRANSACTION', () => {
      expect(GasConstants.GAS_TRANSACTION).toBe(21000n)
    })

    it('exports GAS_CREATE', () => {
      expect(GasConstants.GAS_CREATE).toBe(32000n)
    })

    it('exports GAS_KECCAK256', () => {
      expect(typeof GasConstants.GAS_KECCAK256).toBe('bigint')
    })
  })

  describe('calculation functions', () => {
    it('exports calculateTxIntrinsicGas', () => {
      expect(typeof GasConstants.calculateTxIntrinsicGas).toBe('function')
    })

    it('exports calculateMemoryExpansionCost', () => {
      expect(typeof GasConstants.calculateMemoryExpansionCost).toBe('function')
    })

    it('exports calculateCopyCost', () => {
      expect(typeof GasConstants.calculateCopyCost).toBe('function')
    })
  })
})
