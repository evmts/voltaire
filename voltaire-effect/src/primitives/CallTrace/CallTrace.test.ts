import { describe, it, expect } from 'vitest'
import { Address, Uint as Uint256 } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import * as CallTraceEffect from './index.js'

const ZERO_ADDR = Address.from('0x' + '00'.repeat(20))
const EMPTY_BYTES = new Uint8Array(0)
const GAS = Uint256.from(100000n)
const GAS_USED = Uint256.from(50000n)

describe('CallTrace', () => {
  describe('from', () => {
    it('creates CallTrace from data', async () => {
      const result = await Effect.runPromise(CallTraceEffect.from({
        type: 'CALL',
        from: ZERO_ADDR,
        to: ZERO_ADDR,
        gas: GAS,
        gasUsed: GAS_USED,
        input: EMPTY_BYTES,
        output: EMPTY_BYTES
      }))
      expect(result).toBeDefined()
      expect(result.type).toBe('CALL')
    })
  })

  describe('hasError', () => {
    it('returns false for successful call', async () => {
      const trace = await Effect.runPromise(CallTraceEffect.from({
        type: 'CALL',
        from: ZERO_ADDR,
        to: ZERO_ADDR,
        gas: GAS,
        gasUsed: GAS_USED,
        input: EMPTY_BYTES,
        output: EMPTY_BYTES
      }))
      expect(CallTraceEffect.hasError(trace)).toBe(false)
    })

    it('returns true for failed call', async () => {
      const trace = await Effect.runPromise(CallTraceEffect.from({
        type: 'CALL',
        from: ZERO_ADDR,
        to: ZERO_ADDR,
        gas: GAS,
        gasUsed: GAS_USED,
        input: EMPTY_BYTES,
        output: EMPTY_BYTES,
        error: 'revert'
      }))
      expect(CallTraceEffect.hasError(trace)).toBe(true)
    })
  })

  describe('getCalls', () => {
    it('returns empty array for trace without calls', async () => {
      const trace = await Effect.runPromise(CallTraceEffect.from({
        type: 'CALL',
        from: ZERO_ADDR,
        to: ZERO_ADDR,
        gas: GAS,
        gasUsed: GAS_USED,
        input: EMPTY_BYTES,
        output: EMPTY_BYTES
      }))
      const calls = CallTraceEffect.getCalls(trace)
      expect(calls).toEqual([])
    })
  })

  describe('flatten', () => {
    it('returns array with single trace', async () => {
      const trace = await Effect.runPromise(CallTraceEffect.from({
        type: 'CALL',
        from: ZERO_ADDR,
        to: ZERO_ADDR,
        gas: GAS,
        gasUsed: GAS_USED,
        input: EMPTY_BYTES,
        output: EMPTY_BYTES
      }))
      const flat = CallTraceEffect.flatten(trace)
      expect(flat.length).toBe(1)
      expect(flat[0]).toBe(trace)
    })
  })
})
