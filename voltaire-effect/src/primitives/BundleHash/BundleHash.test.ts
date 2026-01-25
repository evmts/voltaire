import { describe, it, expect } from 'vitest'
import * as BundleHash from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('BundleHashSchema', () => {
  it('decodes from hex string', () => {
    const hex = '0x' + 'ab'.repeat(32)
    const result = Schema.decodeSync(BundleHash.BundleHashSchema)(hex)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('decodes from Uint8Array', () => {
    const bytes = new Uint8Array(32).fill(0xab)
    const result = Schema.decodeSync(BundleHash.BundleHashSchema)(bytes)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('decodes from bigint', () => {
    const bigint = 0xabcdefn
    const result = Schema.decodeSync(BundleHash.BundleHashSchema)(bigint)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('fails for invalid hex', () => {
    expect(() => Schema.decodeSync(BundleHash.BundleHashSchema)('invalid')).toThrow()
  })

  it('fails for wrong byte length', () => {
    const hex = '0x' + 'ab'.repeat(31)
    expect(() => Schema.decodeSync(BundleHash.BundleHashSchema)(hex)).toThrow()
  })
})

describe('BundleHash.from', () => {
  it('creates from hex string', async () => {
    const hex = '0x' + 'cd'.repeat(32)
    const result = await Effect.runPromise(BundleHash.from(hex))
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('creates from Uint8Array', async () => {
    const bytes = new Uint8Array(32).fill(0xcd)
    const result = await Effect.runPromise(BundleHash.from(bytes))
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('creates from bigint', async () => {
    const result = await Effect.runPromise(BundleHash.from(0x123456n))
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('fails for invalid input', async () => {
    const result = await Effect.runPromiseExit(BundleHash.from('invalid'))
    expect(result._tag).toBe('Failure')
  })
})

describe('BundleHash.toHex', () => {
  it('converts to hex string', async () => {
    const hash = await Effect.runPromise(BundleHash.from('0x' + 'ab'.repeat(32)))
    const hex = await Effect.runPromise(BundleHash.toHex(hash))
    expect(hex.startsWith('0x')).toBe(true)
    expect(hex.length).toBe(66)
  })
})

describe('BundleHash.equals', () => {
  it('returns true for equal hashes', async () => {
    const a = await Effect.runPromise(BundleHash.from('0x' + 'ab'.repeat(32)))
    const b = await Effect.runPromise(BundleHash.from('0x' + 'ab'.repeat(32)))
    const result = await Effect.runPromise(BundleHash.equals(a, b))
    expect(result).toBe(true)
  })

  it('returns false for different hashes', async () => {
    const a = await Effect.runPromise(BundleHash.from('0x' + 'ab'.repeat(32)))
    const b = await Effect.runPromise(BundleHash.from('0x' + 'cd'.repeat(32)))
    const result = await Effect.runPromise(BundleHash.equals(a, b))
    expect(result).toBe(false)
  })
})

describe('BundleHash.isZero', () => {
  it('returns true for zero hash', async () => {
    const hash = await Effect.runPromise(BundleHash.from('0x' + '00'.repeat(32)))
    const result = await Effect.runPromise(BundleHash.isZero(hash))
    expect(result).toBe(true)
  })

  it('returns false for non-zero hash', async () => {
    const hash = await Effect.runPromise(BundleHash.from('0x' + 'ab'.repeat(32)))
    const result = await Effect.runPromise(BundleHash.isZero(hash))
    expect(result).toBe(false)
  })
})
