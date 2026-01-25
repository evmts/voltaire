import { describe, it, expect } from 'vitest'
import * as Paymaster from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

const mockPaymasterAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'

describe('PaymasterSchema', () => {
  it('decodes valid paymaster', () => {
    const input = {
      address: mockPaymasterAddress,
      data: '0xabcd1234',
    }
    const result = Schema.decodeSync(Paymaster.PaymasterSchema)(input)
    expect(result.address).toBeInstanceOf(Uint8Array)
    expect(result.address.length).toBe(20)
    expect(result.data).toEqual(new Uint8Array([0xab, 0xcd, 0x12, 0x34]))
  })

  it('decodes with empty data', () => {
    const input = {
      address: mockPaymasterAddress,
      data: '0x',
    }
    const result = Schema.decodeSync(Paymaster.PaymasterSchema)(input)
    expect(result.data).toEqual(new Uint8Array(0))
  })

  it('decodes with validUntil and validAfter', () => {
    const input = {
      address: mockPaymasterAddress,
      data: '0x',
      validUntil: '1700000000',
      validAfter: '1600000000',
    }
    const result = Schema.decodeSync(Paymaster.PaymasterSchema)(input)
    expect(result.validUntil).toBe(1700000000n)
    expect(result.validAfter).toBe(1600000000n)
  })

  it('decodes with bigint validUntil', () => {
    const input = {
      address: mockPaymasterAddress,
      data: '0x',
      validUntil: 1700000000n,
    }
    const result = Schema.decodeSync(Paymaster.PaymasterSchema)(input)
    expect(result.validUntil).toBe(1700000000n)
  })

  it('fails for invalid address', () => {
    expect(() => Schema.decodeSync(Paymaster.PaymasterSchema)({
      address: 'invalid',
      data: '0x',
    })).toThrow()
  })
})

describe('Paymaster.from', () => {
  it('creates from params', async () => {
    const result = await Effect.runPromise(Paymaster.from({
      address: mockPaymasterAddress,
      data: '0xabcd',
    }))
    expect(result.address).toBeInstanceOf(Uint8Array)
    expect(result.data).toEqual(new Uint8Array([0xab, 0xcd]))
  })

  it('handles Uint8Array inputs', async () => {
    const addressBytes = new Uint8Array(20).fill(0xab)
    const dataBytes = new Uint8Array([0x12, 0x34])
    const result = await Effect.runPromise(Paymaster.from({
      address: addressBytes,
      data: dataBytes,
    }))
    expect(result.address).toEqual(addressBytes)
    expect(result.data).toEqual(dataBytes)
  })

  it('handles optional validity times', async () => {
    const result = await Effect.runPromise(Paymaster.from({
      address: mockPaymasterAddress,
      data: '0x',
      validUntil: 1700000000n,
      validAfter: 1600000000n,
    }))
    expect(result.validUntil).toBe(1700000000n)
    expect(result.validAfter).toBe(1600000000n)
  })
})

describe('Paymaster.validate', () => {
  it('succeeds for valid paymaster', async () => {
    const paymaster = await Effect.runPromise(Paymaster.from({
      address: mockPaymasterAddress,
      data: '0x',
      validUntil: 1700000000n,
      validAfter: 1600000000n,
    }))
    await expect(Effect.runPromise(Paymaster.validate(paymaster))).resolves.toBeUndefined()
  })

  it('fails when validAfter >= validUntil', async () => {
    const paymaster = {
      address: new Uint8Array(20),
      data: new Uint8Array(0),
      validUntil: 1600000000n,
      validAfter: 1700000000n,
    } as Paymaster.PaymasterType
    const result = await Effect.runPromiseExit(Paymaster.validate(paymaster))
    expect(result._tag).toBe('Failure')
  })
})

describe('Paymaster.isValid', () => {
  it('returns true when timestamp is within validity window', async () => {
    const paymaster = await Effect.runPromise(Paymaster.from({
      address: mockPaymasterAddress,
      data: '0x',
      validUntil: 1700000000n,
      validAfter: 1600000000n,
    }))
    const result = await Effect.runPromise(Paymaster.isValid(paymaster, 1650000000n))
    expect(result).toBe(true)
  })

  it('returns false when timestamp is before validAfter', async () => {
    const paymaster = await Effect.runPromise(Paymaster.from({
      address: mockPaymasterAddress,
      data: '0x',
      validAfter: 1600000000n,
    }))
    const result = await Effect.runPromise(Paymaster.isValid(paymaster, 1500000000n))
    expect(result).toBe(false)
  })

  it('returns false when timestamp is after validUntil', async () => {
    const paymaster = await Effect.runPromise(Paymaster.from({
      address: mockPaymasterAddress,
      data: '0x',
      validUntil: 1700000000n,
    }))
    const result = await Effect.runPromise(Paymaster.isValid(paymaster, 1800000000n))
    expect(result).toBe(false)
  })

  it('returns true when no validity constraints', async () => {
    const paymaster = await Effect.runPromise(Paymaster.from({
      address: mockPaymasterAddress,
      data: '0x',
    }))
    const result = await Effect.runPromise(Paymaster.isValid(paymaster, 1650000000n))
    expect(result).toBe(true)
  })
})

describe('Paymaster.toHex', () => {
  it('converts to hex representation', async () => {
    const paymaster = await Effect.runPromise(Paymaster.from({
      address: mockPaymasterAddress,
      data: '0xabcd',
      validUntil: 1700000000n,
    }))
    const hex = await Effect.runPromise(Paymaster.toHex(paymaster))
    expect(hex.address.startsWith('0x')).toBe(true)
    expect(hex.data).toBe('0xabcd')
    expect(hex.validUntil).toBeDefined()
  })
})

describe('Paymaster.toPaymasterAndData', () => {
  it('concatenates address and data', async () => {
    const paymaster = await Effect.runPromise(Paymaster.from({
      address: mockPaymasterAddress,
      data: '0xabcd',
    }))
    const result = await Effect.runPromise(Paymaster.toPaymasterAndData(paymaster))
    expect(result.length).toBe(22)
    expect(Array.from(result.slice(0, 20))).toEqual(Array.from(paymaster.address))
    expect(Array.from(result.slice(20))).toEqual(Array.from(paymaster.data))
  })
})

describe('Paymaster.isZeroAddress', () => {
  it('returns true for zero address', async () => {
    const paymaster = await Effect.runPromise(Paymaster.from({
      address: '0x' + '00'.repeat(20),
      data: '0x',
    }))
    const result = await Effect.runPromise(Paymaster.isZeroAddress(paymaster))
    expect(result).toBe(true)
  })

  it('returns false for non-zero address', async () => {
    const paymaster = await Effect.runPromise(Paymaster.from({
      address: mockPaymasterAddress,
      data: '0x',
    }))
    const result = await Effect.runPromise(Paymaster.isZeroAddress(paymaster))
    expect(result).toBe(false)
  })
})
