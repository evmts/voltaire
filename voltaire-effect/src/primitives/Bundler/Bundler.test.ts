import { describe, it, expect } from 'vitest'
import * as Bundler from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('BundlerSchema', () => {
  it('decodes valid hex address', () => {
    const hex = '0x' + 'ab'.repeat(20)
    const result = Schema.decodeSync(Bundler.BundlerSchema)(hex)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(20)
  })

  it('decodes from Uint8Array', () => {
    const bytes = new Uint8Array(20).fill(0xab)
    const result = Schema.decodeSync(Bundler.BundlerSchema)(bytes)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(20)
  })

  it('encodes back to hex', () => {
    const hex = '0x' + 'ab'.repeat(20)
    const decoded = Schema.decodeSync(Bundler.BundlerSchema)(hex)
    const encoded = Schema.encodeSync(Bundler.BundlerSchema)(decoded)
    expect(encoded).toBe(hex)
  })

  it('fails for invalid address', () => {
    expect(() => Schema.decodeSync(Bundler.BundlerSchema)('invalid')).toThrow()
  })

  it('fails for wrong byte length', () => {
    const bytes = new Uint8Array(19).fill(0xab)
    expect(() => Schema.decodeSync(Bundler.BundlerSchema)(bytes)).toThrow()
  })
})

describe('Bundler.from', () => {
  it('creates from hex string', async () => {
    const hex = '0x' + 'cd'.repeat(20)
    const result = await Effect.runPromise(Bundler.from(hex))
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(20)
  })

  it('creates from Uint8Array', async () => {
    const bytes = new Uint8Array(20).fill(0xcd)
    const result = await Effect.runPromise(Bundler.from(bytes))
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(20)
  })

  it('fails for invalid input', async () => {
    const result = await Effect.runPromiseExit(Bundler.from('invalid'))
    expect(result._tag).toBe('Failure')
  })

  it('fails for wrong byte length', async () => {
    const bytes = new Uint8Array(19).fill(0xab)
    const result = await Effect.runPromiseExit(Bundler.from(bytes))
    expect(result._tag).toBe('Failure')
  })
})

describe('Bundler.toHex', () => {
  it('converts to hex string', async () => {
    const bundler = await Effect.runPromise(Bundler.from('0x' + 'ab'.repeat(20)))
    const hex = await Effect.runPromise(Bundler.toHex(bundler))
    expect(hex.startsWith('0x')).toBe(true)
    expect(hex.length).toBe(42)
  })
})

describe('Bundler.equals', () => {
  it('returns true for equal bundlers', async () => {
    const a = await Effect.runPromise(Bundler.from('0x' + 'ab'.repeat(20)))
    const b = await Effect.runPromise(Bundler.from('0x' + 'ab'.repeat(20)))
    const result = await Effect.runPromise(Bundler.equals(a, b))
    expect(result).toBe(true)
  })

  it('returns false for different bundlers', async () => {
    const a = await Effect.runPromise(Bundler.from('0x' + 'ab'.repeat(20)))
    const b = await Effect.runPromise(Bundler.from('0x' + 'cd'.repeat(20)))
    const result = await Effect.runPromise(Bundler.equals(a, b))
    expect(result).toBe(false)
  })
})

describe('Bundler.isZero', () => {
  it('returns true for zero address', async () => {
    const bundler = await Effect.runPromise(Bundler.from('0x' + '00'.repeat(20)))
    const result = await Effect.runPromise(Bundler.isZero(bundler))
    expect(result).toBe(true)
  })

  it('returns false for non-zero address', async () => {
    const bundler = await Effect.runPromise(Bundler.from('0x' + 'ab'.repeat(20)))
    const result = await Effect.runPromise(Bundler.isZero(bundler))
    expect(result).toBe(false)
  })
})
