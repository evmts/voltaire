import { describe, it, expect } from 'vitest'
import * as S from 'effect/Schema'
import { ReceiptSchema, ReceiptTypeSchema, type ReceiptType, type LogType } from './ReceiptSchema.js'
import { Address, Hash } from '@tevm/voltaire'

describe('ReceiptSchema', () => {
  const mockAddress = Address('0x1234567890123456789012345678901234567890')
  const mockHash = Hash('0x' + '00'.repeat(32))
  const mockLogsBloom = new Uint8Array(256)

  const validReceipt: ReceiptType = {
    transactionHash: mockHash,
    blockNumber: 12345n,
    blockHash: mockHash,
    transactionIndex: 0,
    from: mockAddress,
    to: mockAddress,
    cumulativeGasUsed: 21000n,
    gasUsed: 21000n,
    contractAddress: null,
    logs: [],
    logsBloom: mockLogsBloom,
    status: 1,
  }

  it('validates a valid receipt with ReceiptTypeSchema', () => {
    const result = S.is(ReceiptTypeSchema)(validReceipt)
    expect(result).toBe(true)
  })

  it('rejects invalid receipt', () => {
    const invalidReceipt = { foo: 'bar' }
    const result = S.is(ReceiptTypeSchema)(invalidReceipt)
    expect(result).toBe(false)
  })

  it('validates receipt with status 0', () => {
    const failedReceipt: ReceiptType = { ...validReceipt, status: 0 }
    const result = S.is(ReceiptTypeSchema)(failedReceipt)
    expect(result).toBe(true)
  })

  it('validates receipt with logs', () => {
    const log: LogType = {
      address: mockAddress,
      topics: [mockHash],
      data: new Uint8Array([1, 2, 3]),
      blockNumber: 12345n,
      transactionHash: mockHash,
      transactionIndex: 0,
      blockHash: mockHash,
      logIndex: 0,
      removed: false,
    }
    const receiptWithLogs: ReceiptType = { ...validReceipt, logs: [log] }
    const result = S.is(ReceiptTypeSchema)(receiptWithLogs)
    expect(result).toBe(true)
  })

  it('validates receipt with contract address', () => {
    const contractReceipt: ReceiptType = {
      ...validReceipt,
      to: null,
      contractAddress: mockAddress,
    }
    const result = S.is(ReceiptTypeSchema)(contractReceipt)
    expect(result).toBe(true)
  })

  it('rejects non-object values', () => {
    expect(S.is(ReceiptTypeSchema)(null)).toBe(false)
    expect(S.is(ReceiptTypeSchema)(undefined)).toBe(false)
    expect(S.is(ReceiptTypeSchema)('string')).toBe(false)
    expect(S.is(ReceiptTypeSchema)(123)).toBe(false)
  })

  it('rejects receipt with invalid status', () => {
    const invalidStatus = { ...validReceipt, status: 2 }
    const result = S.is(ReceiptTypeSchema)(invalidStatus)
    expect(result).toBe(false)
  })
})
