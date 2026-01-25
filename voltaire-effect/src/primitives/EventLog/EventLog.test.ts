import { describe, it, expect } from 'vitest'
import * as S from 'effect/Schema'
import { EventLogSchema, EventLogTypeSchema } from './EventLogSchema.js'
import { Address, Hash } from '@tevm/voltaire'
import * as EventLog from '@tevm/voltaire/EventLog'

describe('EventLogSchema', () => {
  const mockAddress = Address('0x1234567890123456789012345678901234567890')
  const mockHash = Hash('0x' + '00'.repeat(32))

  const validEventLog = EventLog.from({
    address: mockAddress,
    topics: [mockHash],
    data: new Uint8Array([1, 2, 3]),
  })

  it('validates a valid event log with EventLogTypeSchema', () => {
    const result = S.is(EventLogTypeSchema)(validEventLog)
    expect(result).toBe(true)
  })

  it('rejects invalid event log', () => {
    const invalidLog = { foo: 'bar' }
    const result = S.is(EventLogTypeSchema)(invalidLog)
    expect(result).toBe(false)
  })

  it('validates event log with all optional fields', () => {
    const fullLog = EventLog.from({
      address: mockAddress,
      topics: [mockHash, mockHash],
      data: new Uint8Array([1, 2, 3]),
      blockNumber: 12345n,
      transactionHash: mockHash,
      transactionIndex: 0,
      blockHash: mockHash,
      logIndex: 5,
      removed: false,
    })
    const result = S.is(EventLogTypeSchema)(fullLog)
    expect(result).toBe(true)
  })

  it('validates event log with removed flag', () => {
    const removedLog = EventLog.from({
      address: mockAddress,
      topics: [],
      data: new Uint8Array(),
      removed: true,
    })
    const result = S.is(EventLogTypeSchema)(removedLog)
    expect(result).toBe(true)
  })

  it('rejects non-object values', () => {
    expect(S.is(EventLogTypeSchema)(null)).toBe(false)
    expect(S.is(EventLogTypeSchema)(undefined)).toBe(false)
    expect(S.is(EventLogTypeSchema)('string')).toBe(false)
    expect(S.is(EventLogTypeSchema)(123)).toBe(false)
  })

  it('rejects event log with invalid address', () => {
    const invalidAddress = {
      address: new Uint8Array(10),
      topics: [],
      data: new Uint8Array(),
    }
    const result = S.is(EventLogTypeSchema)(invalidAddress)
    expect(result).toBe(false)
  })

  it('rejects event log with non-array topics', () => {
    const invalidTopics = {
      address: mockAddress,
      topics: 'not-an-array',
      data: new Uint8Array(),
    }
    const result = S.is(EventLogTypeSchema)(invalidTopics)
    expect(result).toBe(false)
  })
})
