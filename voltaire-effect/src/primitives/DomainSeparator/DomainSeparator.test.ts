import { describe, it, expect } from 'vitest'
import * as DomainSeparator from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('DomainSeparatorSchema', () => {
  it('decodes valid hex string', () => {
    const hex = '0x' + 'ab'.repeat(32)
    const result = Schema.decodeSync(DomainSeparator.DomainSeparatorSchema)(hex)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('decodes 32-byte Uint8Array', () => {
    const bytes = new Uint8Array(32).fill(0xab)
    const result = Schema.decodeSync(DomainSeparator.DomainSeparatorSchema)(bytes)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('fails for wrong byte length', () => {
    const bytes = new Uint8Array(16)
    expect(() => Schema.decodeSync(DomainSeparator.DomainSeparatorSchema)(bytes)).toThrow()
  })

  it('encodes back to hex', () => {
    const hex = '0x' + 'ab'.repeat(32)
    const decoded = Schema.decodeSync(DomainSeparator.DomainSeparatorSchema)(hex)
    const encoded = Schema.encodeSync(DomainSeparator.DomainSeparatorSchema)(decoded)
    expect(encoded).toBe(hex)
  })
})

describe('DomainSeparator.from', () => {
  it('creates from hex string', async () => {
    const hex = '0x' + 'cd'.repeat(32)
    const result = await Effect.runPromise(DomainSeparator.from(hex))
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('creates from Uint8Array', async () => {
    const bytes = new Uint8Array(32).fill(0xcd)
    const result = await Effect.runPromise(DomainSeparator.from(bytes))
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('fails for invalid input', async () => {
    const result = await Effect.runPromiseExit(DomainSeparator.from('invalid'))
    expect(result._tag).toBe('Failure')
  })
})

describe('DomainSeparator.fromBytes', () => {
  it('creates from bytes', async () => {
    const bytes = new Uint8Array(32).fill(0xef)
    const result = await Effect.runPromise(DomainSeparator.fromBytes(bytes))
    expect(result.length).toBe(32)
  })

  it('fails for wrong length', async () => {
    const bytes = new Uint8Array(16)
    const result = await Effect.runPromiseExit(DomainSeparator.fromBytes(bytes))
    expect(result._tag).toBe('Failure')
  })
})

describe('DomainSeparator.toHex', () => {
  it('converts to hex string', async () => {
    const bytes = new Uint8Array(32).fill(0xab)
    const separator = await Effect.runPromise(DomainSeparator.fromBytes(bytes))
    const hex = await Effect.runPromise(DomainSeparator.toHex(separator))
    expect(hex.startsWith('0x')).toBe(true)
    expect(hex.length).toBe(66)
  })
})

describe('DomainSeparator.equals', () => {
  it('returns true for equal separators', async () => {
    const a = await Effect.runPromise(DomainSeparator.from('0x' + 'ab'.repeat(32)))
    const b = await Effect.runPromise(DomainSeparator.from('0x' + 'ab'.repeat(32)))
    const result = await Effect.runPromise(DomainSeparator.equals(a, b))
    expect(result).toBe(true)
  })

  it('returns false for different separators', async () => {
    const a = await Effect.runPromise(DomainSeparator.from('0x' + 'ab'.repeat(32)))
    const b = await Effect.runPromise(DomainSeparator.from('0x' + 'cd'.repeat(32)))
    const result = await Effect.runPromise(DomainSeparator.equals(a, b))
    expect(result).toBe(false)
  })
})
