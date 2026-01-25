import { describe, it, expect } from 'vitest'
import * as EventSignature from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('EventSignatureSchema', () => {
  it('decodes valid hex string', () => {
    const hex = '0x' + 'ab'.repeat(32)
    const result = Schema.decodeSync(EventSignature.EventSignatureSchema)(hex)
    expect(result.length).toBe(32)
  })

  it('decodes 32-byte Uint8Array', () => {
    const input = new Uint8Array(32).fill(0xab)
    const result = Schema.decodeSync(EventSignature.EventSignatureSchema)(input)
    expect(result).toEqual(input)
  })

  it('fails on wrong size', () => {
    expect(() => Schema.decodeSync(EventSignature.EventSignatureSchema)('0x1234')).toThrow()
  })

  it('encodes back to hex', () => {
    const hex = '0x' + 'ab'.repeat(32)
    const decoded = Schema.decodeSync(EventSignature.EventSignatureSchema)(hex)
    const encoded = Schema.encodeSync(EventSignature.EventSignatureSchema)(decoded)
    expect(encoded).toBe(hex)
  })
})

describe('EventSignature.from', () => {
  it('creates from hex', async () => {
    const hex = '0x' + 'cd'.repeat(32)
    const result = await Effect.runPromise(EventSignature.from(hex))
    expect(result.length).toBe(32)
  })

  it('creates from Uint8Array', async () => {
    const input = new Uint8Array(32).fill(0xcd)
    const result = await Effect.runPromise(EventSignature.from(input))
    expect(result).toEqual(input)
  })

  it('fails on wrong length', async () => {
    const result = await Effect.runPromiseExit(EventSignature.from('0x1234'))
    expect(result._tag).toBe('Failure')
  })
})

describe('EventSignature.fromHex', () => {
  it('creates from hex string', async () => {
    const hex = '0x' + 'ef'.repeat(32)
    const result = await Effect.runPromise(EventSignature.fromHex(hex))
    expect(result.length).toBe(32)
  })

  it('fails on invalid hex', async () => {
    const result = await Effect.runPromiseExit(EventSignature.fromHex('invalid'))
    expect(result._tag).toBe('Failure')
  })
})

describe('EventSignature.fromSignature', () => {
  it('computes Transfer event signature', async () => {
    const result = await Effect.runPromise(EventSignature.fromSignature('Transfer(address,address,uint256)'))
    expect(result.length).toBe(32)
    const hex = await Effect.runPromise(EventSignature.toHex(result))
    expect(hex).toBe('0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef')
  })

  it('computes Approval event signature', async () => {
    const result = await Effect.runPromise(EventSignature.fromSignature('Approval(address,address,uint256)'))
    expect(result.length).toBe(32)
  })
})

describe('EventSignature.toHex', () => {
  it('converts to hex', async () => {
    const sig = await Effect.runPromise(EventSignature.from('0x' + 'ab'.repeat(32)))
    const hex = await Effect.runPromise(EventSignature.toHex(sig))
    expect(hex).toBe('0x' + 'ab'.repeat(32))
  })
})

describe('EventSignature.equals', () => {
  it('returns true for equal signatures', async () => {
    const a = await Effect.runPromise(EventSignature.from('0x' + 'ab'.repeat(32)))
    const b = await Effect.runPromise(EventSignature.from('0x' + 'ab'.repeat(32)))
    const result = await Effect.runPromise(EventSignature.equals(a, b))
    expect(result).toBe(true)
  })

  it('returns false for different signatures', async () => {
    const a = await Effect.runPromise(EventSignature.from('0x' + 'ab'.repeat(32)))
    const b = await Effect.runPromise(EventSignature.from('0x' + 'cd'.repeat(32)))
    const result = await Effect.runPromise(EventSignature.equals(a, b))
    expect(result).toBe(false)
  })
})
