import { describe, it, expect } from 'vitest'
import * as EntryPoint from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('EntryPointSchema', () => {
  it('decodes valid hex address', () => {
    const hex = '0x' + 'ab'.repeat(20)
    const result = Schema.decodeSync(EntryPoint.EntryPointSchema)(hex)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(20)
  })

  it('decodes from Uint8Array', () => {
    const bytes = new Uint8Array(20).fill(0xab)
    const result = Schema.decodeSync(EntryPoint.EntryPointSchema)(bytes)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(20)
  })

  it('encodes back to hex', () => {
    const hex = '0x' + 'ab'.repeat(20)
    const decoded = Schema.decodeSync(EntryPoint.EntryPointSchema)(hex)
    const encoded = Schema.encodeSync(EntryPoint.EntryPointSchema)(decoded)
    expect(encoded).toBe(hex)
  })
})

describe('EntryPoint constants', () => {
  it('exports ENTRYPOINT_V06', () => {
    expect(EntryPoint.ENTRYPOINT_V06).toBeDefined()
  })

  it('exports ENTRYPOINT_V07', () => {
    expect(EntryPoint.ENTRYPOINT_V07).toBeDefined()
  })
})

describe('EntryPoint.from', () => {
  it('creates from hex string', async () => {
    const hex = '0x' + 'cd'.repeat(20)
    const result = await Effect.runPromise(EntryPoint.from(hex))
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(20)
  })

  it('creates from Uint8Array', async () => {
    const bytes = new Uint8Array(20).fill(0xcd)
    const result = await Effect.runPromise(EntryPoint.from(bytes))
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(20)
  })

  it('fails for invalid input', async () => {
    const result = await Effect.runPromiseExit(EntryPoint.from('invalid'))
    expect(result._tag).toBe('Failure')
  })
})

describe('EntryPoint.toHex', () => {
  it('converts to hex string', async () => {
    const entryPoint = await Effect.runPromise(EntryPoint.from('0x' + 'ab'.repeat(20)))
    const hex = await Effect.runPromise(EntryPoint.toHex(entryPoint))
    expect(hex.startsWith('0x')).toBe(true)
    expect(hex.length).toBe(42)
  })
})

describe('EntryPoint.equals', () => {
  it('returns true for equal entry points', async () => {
    const a = await Effect.runPromise(EntryPoint.from('0x' + 'ab'.repeat(20)))
    const b = await Effect.runPromise(EntryPoint.from('0x' + 'ab'.repeat(20)))
    const result = await Effect.runPromise(EntryPoint.equals(a, b))
    expect(result).toBe(true)
  })

  it('returns false for different entry points', async () => {
    const a = await Effect.runPromise(EntryPoint.from('0x' + 'ab'.repeat(20)))
    const b = await Effect.runPromise(EntryPoint.from('0x' + 'cd'.repeat(20)))
    const result = await Effect.runPromise(EntryPoint.equals(a, b))
    expect(result).toBe(false)
  })
})
