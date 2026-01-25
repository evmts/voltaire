import { describe, it, expect } from 'vitest'
import * as Hash from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'

const VALID_HASH_HEX = '0x' + 'ab'.repeat(32)
const ZERO_HASH_HEX = '0x' + '00'.repeat(32)

describe('Hash.Schema', () => {
  it('decodes valid 64-char hex with 0x prefix', () => {
    const result = Schema.decodeSync(Hash.Schema)(VALID_HASH_HEX)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('decodes valid 64-char hex without 0x prefix', () => {
    const result = Schema.decodeSync(Hash.Schema)('ab'.repeat(32))
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('encodes back to hex string', () => {
    const hash = Schema.decodeSync(Hash.Schema)(VALID_HASH_HEX)
    const encoded = Schema.encodeSync(Hash.Schema)(hash)
    expect(encoded).toBe(VALID_HASH_HEX)
  })

  it('fails for wrong length', () => {
    expect(() => Schema.decodeSync(Hash.Schema)('0x1234')).toThrow()
  })

  it('fails for invalid hex characters', () => {
    expect(() => Schema.decodeSync(Hash.Schema)('0x' + 'gg'.repeat(32))).toThrow()
  })
})

describe('Hash.fromBytes', () => {
  it('creates hash from 32 bytes', async () => {
    const bytes = new Uint8Array(32).fill(0xab)
    const result = await Effect.runPromise(Hash.fromBytes(bytes))
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
    expect(result[0]).toBe(0xab)
  })

  it('fails for wrong length', async () => {
    const bytes = new Uint8Array(31)
    const exit = await Effect.runPromiseExit(Hash.fromBytes(bytes))
    expect(Exit.isFailure(exit)).toBe(true)
  })
})

describe('Hash.fromHex', () => {
  it('creates hash from hex string', async () => {
    const result = await Effect.runPromise(Hash.fromHex(VALID_HASH_HEX))
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('fails for wrong length', async () => {
    const exit = await Effect.runPromiseExit(Hash.fromHex('0x1234'))
    expect(Exit.isFailure(exit)).toBe(true)
  })

  it('fails for invalid hex', async () => {
    const exit = await Effect.runPromiseExit(Hash.fromHex('0x' + 'zz'.repeat(32)))
    expect(Exit.isFailure(exit)).toBe(true)
  })
})

describe('Hash.toBytes', () => {
  it('converts hash to Uint8Array copy', () => {
    const hash = Schema.decodeSync(Hash.Schema)(VALID_HASH_HEX)
    const bytes = Hash.toBytes(hash)
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBe(32)
    expect(bytes).not.toBe(hash)
  })
})

describe('Hash.toHex', () => {
  it('converts hash to hex string with 0x prefix', () => {
    const hash = Schema.decodeSync(Hash.Schema)(VALID_HASH_HEX)
    const hex = Hash.toHex(hash)
    expect(hex).toBe(VALID_HASH_HEX)
  })

  it('works with zero hash', () => {
    const hash = Schema.decodeSync(Hash.Schema)(ZERO_HASH_HEX)
    const hex = Hash.toHex(hash)
    expect(hex).toBe(ZERO_HASH_HEX)
  })
})
