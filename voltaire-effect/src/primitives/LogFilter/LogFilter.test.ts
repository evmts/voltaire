import { describe, it, expect } from 'vitest'
import * as S from 'effect/Schema'
import { LogFilterSchema, LogFilterTypeSchema } from './LogFilterSchema.js'
import { Address, Hash } from '@tevm/voltaire'
import * as LogFilter from '@tevm/voltaire/LogFilter'

describe('LogFilterSchema', () => {
  const mockAddress = Address('0x1234567890123456789012345678901234567890')
  const mockHash = Hash('0x' + '00'.repeat(32))

  const validFilter = LogFilter.from({
    fromBlock: 'latest',
    address: mockAddress,
  })

  it('validates a valid log filter with LogFilterTypeSchema', () => {
    const result = S.is(LogFilterTypeSchema)(validFilter)
    expect(result).toBe(true)
  })

  it('validates empty filter', () => {
    const emptyFilter = LogFilter.from({})
    const result = S.is(LogFilterTypeSchema)(emptyFilter)
    expect(result).toBe(true)
  })

  it('validates filter with block range', () => {
    const rangeFilter = LogFilter.from({
      fromBlock: 1000n as unknown as import('@tevm/voltaire/LogFilter').LogFilterType['fromBlock'],
      toBlock: 2000n as unknown as import('@tevm/voltaire/LogFilter').LogFilterType['toBlock'],
    })
    const result = S.is(LogFilterTypeSchema)(rangeFilter)
    expect(result).toBe(true)
  })

  it('validates filter with block tags', () => {
    const tagFilter = LogFilter.from({
      fromBlock: 'earliest',
      toBlock: 'pending',
    })
    const result = S.is(LogFilterTypeSchema)(tagFilter)
    expect(result).toBe(true)
  })

  it('validates filter with multiple addresses', () => {
    const multiAddrFilter = LogFilter.from({
      address: [mockAddress, mockAddress],
    })
    const result = S.is(LogFilterTypeSchema)(multiAddrFilter)
    expect(result).toBe(true)
  })

  it('validates filter with topics', () => {
    const topicFilter = LogFilter.from({
      topics: [mockHash, null, mockHash] as unknown as import('@tevm/voltaire/LogFilter').LogFilterType['topics'],
    })
    const result = S.is(LogFilterTypeSchema)(topicFilter)
    expect(result).toBe(true)
  })

  it('validates filter with blockhash', () => {
    const hashFilter = LogFilter.from({
      blockhash: mockHash,
    })
    const result = S.is(LogFilterTypeSchema)(hashFilter)
    expect(result).toBe(true)
  })

  it('rejects non-object values', () => {
    expect(S.is(LogFilterTypeSchema)(null)).toBe(false)
    expect(S.is(LogFilterTypeSchema)('string')).toBe(false)
    expect(S.is(LogFilterTypeSchema)(123)).toBe(false)
  })

  it('rejects filter with invalid address', () => {
    const invalidAddress = {
      address: new Uint8Array(10),
    }
    const result = S.is(LogFilterTypeSchema)(invalidAddress)
    expect(result).toBe(false)
  })
})
