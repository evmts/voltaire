import { describe, it, expect } from 'vitest'
import * as EncodedData from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('EncodedDataSchema', () => {
  it('decodes valid hex string', () => {
    const result = Schema.decodeSync(EncodedData.EncodedDataSchema)('0x1234abcd')
    expect(result).toBe('0x1234abcd')
  })

  it('decodes from Uint8Array', () => {
    const bytes = new Uint8Array([0x12, 0x34, 0xab, 0xcd])
    const result = Schema.decodeSync(EncodedData.EncodedDataSchema)(bytes)
    expect(result.startsWith('0x')).toBe(true)
  })

  it('encodes back to string', () => {
    const decoded = Schema.decodeSync(EncodedData.EncodedDataSchema)('0x1234')
    const encoded = Schema.encodeSync(EncodedData.EncodedDataSchema)(decoded)
    expect(encoded).toBe('0x1234')
  })
})

describe('EncodedData.from', () => {
  it('creates from hex string', async () => {
    const result = await Effect.runPromise(EncodedData.from('0xabcdef'))
    expect(result).toBe('0xabcdef')
  })

  it('creates from Uint8Array', async () => {
    const bytes = new Uint8Array([0xab, 0xcd, 0xef])
    const result = await Effect.runPromise(EncodedData.from(bytes))
    expect(result.startsWith('0x')).toBe(true)
  })
})

describe('EncodedData.fromBytes', () => {
  it('creates from bytes', async () => {
    const bytes = new Uint8Array([0x12, 0x34])
    const result = await Effect.runPromise(EncodedData.fromBytes(bytes))
    expect(result).toBe('0x1234')
  })
})

describe('EncodedData.toBytes', () => {
  it('converts to bytes', async () => {
    const data = await Effect.runPromise(EncodedData.from('0x1234'))
    const bytes = await Effect.runPromise(EncodedData.toBytes(data))
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes).toEqual(new Uint8Array([0x12, 0x34]))
  })
})

describe('EncodedData.equals', () => {
  it('returns true for equal data', async () => {
    const a = await Effect.runPromise(EncodedData.from('0x1234'))
    const b = await Effect.runPromise(EncodedData.from('0x1234'))
    const result = await Effect.runPromise(EncodedData.equals(a, b))
    expect(result).toBe(true)
  })

  it('returns false for different data', async () => {
    const a = await Effect.runPromise(EncodedData.from('0x1234'))
    const b = await Effect.runPromise(EncodedData.from('0xabcd'))
    const result = await Effect.runPromise(EncodedData.equals(a, b))
    expect(result).toBe(false)
  })
})
