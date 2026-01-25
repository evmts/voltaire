import { describe, it, expect } from 'vitest'
import * as StorageValue from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('StorageValue Schema', () => {
  it('decodes valid hex string', () => {
    const hex = '0x' + '12'.repeat(32)
    const result = Schema.decodeSync(StorageValue.StorageValueSchema)(hex)
    expect(result.length).toBe(32)
  })

  it('decodes 32-byte Uint8Array', () => {
    const input = new Uint8Array(32).fill(0x42)
    const result = Schema.decodeSync(StorageValue.StorageValueSchema)(input)
    expect(result).toEqual(input)
  })

  it('decodes bigint', () => {
    const result = Schema.decodeSync(StorageValue.StorageValueSchema)(42n)
    expect(result.length).toBe(32)
  })

  it('decodes number', () => {
    const result = Schema.decodeSync(StorageValue.StorageValueSchema)(42)
    expect(result.length).toBe(32)
  })

  it('fails on wrong size', () => {
    const hex = '0x1234'
    expect(() => Schema.decodeSync(StorageValue.StorageValueSchema)(hex)).toThrow()
  })

  it('decodes zero value (all zeros)', () => {
    const hex = '0x' + '00'.repeat(32)
    const result = Schema.decodeSync(StorageValue.StorageValueSchema)(hex)
    expect(result.length).toBe(32)
    expect(result.every((b: number) => b === 0)).toBe(true)
  })

  it('decodes max uint256 value', () => {
    const hex = '0x' + 'ff'.repeat(32)
    const result = Schema.decodeSync(StorageValue.StorageValueSchema)(hex)
    expect(result.length).toBe(32)
    expect(result.every((b: number) => b === 0xff)).toBe(true)
  })
})

describe('StorageValue.from', () => {
  it('creates storage value from valid hex', async () => {
    const hex = '0x' + '00'.repeat(32)
    const result = await Effect.runPromise(StorageValue.from(hex))
    expect(result.length).toBe(32)
  })

  it('creates storage value from Uint8Array', async () => {
    const input = new Uint8Array(32).fill(0xff)
    const result = await Effect.runPromise(StorageValue.from(input))
    expect(result).toEqual(input)
  })

  it('creates storage value from bigint', async () => {
    const result = await Effect.runPromise(StorageValue.from(123456789n))
    expect(result.length).toBe(32)
  })

  it('creates storage value from number', async () => {
    const result = await Effect.runPromise(StorageValue.from(42))
    expect(result.length).toBe(32)
  })

  it('fails on wrong length hex', async () => {
    const result = await Effect.runPromiseExit(StorageValue.from('0x1234'))
    expect(result._tag).toBe('Failure')
  })

  it('fails on wrong length bytes', async () => {
    const result = await Effect.runPromiseExit(StorageValue.from(new Uint8Array(16)))
    expect(result._tag).toBe('Failure')
  })
})

describe('StorageValue.zero', () => {
  it('creates zero storage value (all zeros)', () => {
    const result = StorageValue.zero()
    expect(result.length).toBe(32)
    expect(result.every((b: number) => b === 0)).toBe(true)
  })
})

describe('StorageValue.fromBigInt', () => {
  it('creates storage value from bigint', async () => {
    const result = await Effect.runPromise(StorageValue.fromBigInt(1000n))
    expect(result.length).toBe(32)
  })

  it('creates storage value from zero', async () => {
    const result = await Effect.runPromise(StorageValue.fromBigInt(0n))
    expect(result.length).toBe(32)
    expect(result.every((b: number) => b === 0)).toBe(true)
  })

  it('creates storage value from max uint256', async () => {
    const maxUint256 = 2n ** 256n - 1n
    const result = await Effect.runPromise(StorageValue.fromBigInt(maxUint256))
    expect(result.length).toBe(32)
    expect(result.every((b: number) => b === 0xff)).toBe(true)
  })
})
