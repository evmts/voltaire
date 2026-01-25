import { describe, it, expect } from 'vitest'
import * as ForwardRequest from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

const mockAddress1 = '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'
const mockAddress2 = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'

describe('ForwardRequestSchema', () => {
  it('decodes valid forward request', () => {
    const input = {
      from: mockAddress1,
      to: mockAddress2,
      value: '1000000000000000000',
      gas: '100000',
      nonce: '0',
      deadline: '1700000000',
      data: '0x',
    }
    const result = Schema.decodeSync(ForwardRequest.ForwardRequestSchema)(input)
    expect(result.from).toBeInstanceOf(Uint8Array)
    expect(result.from.length).toBe(20)
    expect(result.value).toBe(1000000000000000000n)
    expect(result.gas).toBe(100000n)
  })

  it('decodes with bigint inputs', () => {
    const input = {
      from: mockAddress1,
      to: mockAddress2,
      value: 1000000000000000000n,
      gas: 100000n,
      nonce: 0n,
      deadline: 1700000000n,
      data: '0xabcd',
    }
    const result = Schema.decodeSync(ForwardRequest.ForwardRequestSchema)(input)
    expect(result.value).toBe(1000000000000000000n)
  })

  it('decodes calldata correctly', () => {
    const input = {
      from: mockAddress1,
      to: mockAddress2,
      value: '0',
      gas: '100000',
      nonce: '0',
      deadline: '1700000000',
      data: '0xabcd1234',
    }
    const result = Schema.decodeSync(ForwardRequest.ForwardRequestSchema)(input)
    expect(result.data).toEqual(new Uint8Array([0xab, 0xcd, 0x12, 0x34]))
  })

  it('fails for invalid from address', () => {
    expect(() => Schema.decodeSync(ForwardRequest.ForwardRequestSchema)({
      from: 'invalid',
      to: mockAddress2,
      value: '0',
      gas: '100000',
      nonce: '0',
      deadline: '1700000000',
      data: '0x',
    })).toThrow()
  })
})

describe('ForwardRequest.from', () => {
  it('creates from params', async () => {
    const result = await Effect.runPromise(ForwardRequest.from({
      from: mockAddress1,
      to: mockAddress2,
      value: 1000000000000000000n,
      gas: 100000n,
      nonce: 0n,
      deadline: 1700000000n,
      data: '0x',
    }))
    expect(result.from).toBeInstanceOf(Uint8Array)
    expect(result.value).toBe(1000000000000000000n)
  })

  it('handles Uint8Array addresses', async () => {
    const fromBytes = new Uint8Array(20).fill(0xab)
    const toBytes = new Uint8Array(20).fill(0xcd)
    const result = await Effect.runPromise(ForwardRequest.from({
      from: fromBytes,
      to: toBytes,
      value: 0n,
      gas: 100000n,
      nonce: 0n,
      deadline: 1700000000n,
      data: new Uint8Array([0x12, 0x34]),
    }))
    expect(result.from).toEqual(fromBytes)
    expect(result.to).toEqual(toBytes)
  })

  it('handles string number inputs', async () => {
    const result = await Effect.runPromise(ForwardRequest.from({
      from: mockAddress1,
      to: mockAddress2,
      value: '1000000000000000000',
      gas: '100000',
      nonce: '0',
      deadline: '1700000000',
      data: '0x',
    }))
    expect(result.value).toBe(1000000000000000000n)
  })
})

describe('ForwardRequest.validate', () => {
  it('succeeds for valid request', async () => {
    const req = await Effect.runPromise(ForwardRequest.from({
      from: mockAddress1,
      to: mockAddress2,
      value: 0n,
      gas: 100000n,
      nonce: 0n,
      deadline: 1700000000n,
      data: '0x',
    }))
    await expect(Effect.runPromise(ForwardRequest.validate(req))).resolves.toBeUndefined()
  })

  it('fails for negative value', async () => {
    const req = {
      from: new Uint8Array(20),
      to: new Uint8Array(20),
      value: -1n,
      gas: 100000n,
      nonce: 0n,
      deadline: 1700000000n,
      data: new Uint8Array(0),
    } as ForwardRequest.ForwardRequestType
    const result = await Effect.runPromiseExit(ForwardRequest.validate(req))
    expect(result._tag).toBe('Failure')
  })

  it('fails for zero gas', async () => {
    const req = {
      from: new Uint8Array(20),
      to: new Uint8Array(20),
      value: 0n,
      gas: 0n,
      nonce: 0n,
      deadline: 1700000000n,
      data: new Uint8Array(0),
    } as ForwardRequest.ForwardRequestType
    const result = await Effect.runPromiseExit(ForwardRequest.validate(req))
    expect(result._tag).toBe('Failure')
  })
})

describe('ForwardRequest.isExpired', () => {
  it('returns false when deadline is in future', async () => {
    const req = {
      from: new Uint8Array(20),
      to: new Uint8Array(20),
      value: 0n,
      gas: 100000n,
      nonce: 0n,
      deadline: 2000000000n,
      data: new Uint8Array(0),
    } as ForwardRequest.ForwardRequestType
    const result = await Effect.runPromise(ForwardRequest.isExpired(req, 1700000000n))
    expect(result).toBe(false)
  })

  it('returns true when deadline is in past', async () => {
    const req = {
      from: new Uint8Array(20),
      to: new Uint8Array(20),
      value: 0n,
      gas: 100000n,
      nonce: 0n,
      deadline: 1600000000n,
      data: new Uint8Array(0),
    } as ForwardRequest.ForwardRequestType
    const result = await Effect.runPromise(ForwardRequest.isExpired(req, 1700000000n))
    expect(result).toBe(true)
  })
})

describe('ForwardRequest.toHex', () => {
  it('converts to hex representation', async () => {
    const req = await Effect.runPromise(ForwardRequest.from({
      from: mockAddress1,
      to: mockAddress2,
      value: 1000000000000000000n,
      gas: 100000n,
      nonce: 5n,
      deadline: 1700000000n,
      data: '0xabcd',
    }))
    const hex = await Effect.runPromise(ForwardRequest.toHex(req))
    expect(hex.from.startsWith('0x')).toBe(true)
    expect(hex.to.startsWith('0x')).toBe(true)
    expect(hex.data).toBe('0xabcd')
  })
})
