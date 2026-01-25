import { describe, it, expect } from 'vitest'
import * as Hex from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('Hex Schema', () => {
  it('decodes valid hex string', () => {
    const result = Schema.decodeSync(Hex.Schema)("0x1234")
    expect(result).toBe("0x1234")
  })

  it('decodes empty hex', () => {
    const result = Schema.decodeSync(Hex.Schema)("0x")
    expect(result).toBe("0x")
  })

  it('fails on invalid hex (missing prefix)', () => {
    expect(() => Schema.decodeSync(Hex.Schema)("1234")).toThrow()
  })
})

describe('Hex.from', () => {
  it('creates hex from string', async () => {
    const result = await Effect.runPromise(Hex.from("0x1234"))
    expect(result).toBe("0x1234")
  })

  it('creates hex from bytes', async () => {
    const bytes = new Uint8Array([0x12, 0x34])
    const result = await Effect.runPromise(Hex.from(bytes))
    expect(result).toBe("0x1234")
  })
})

describe('Hex.fromBytes', () => {
  it('converts bytes to hex', async () => {
    const bytes = new Uint8Array([0x12, 0x34])
    const result = await Effect.runPromise(Hex.fromBytes(bytes))
    expect(result).toBe("0x1234")
  })

  it('handles empty bytes', async () => {
    const result = await Effect.runPromise(Hex.fromBytes(new Uint8Array(0)))
    expect(result).toBe("0x")
  })
})

describe('Hex.toBytes', () => {
  it('converts hex to bytes', async () => {
    const result = await Effect.runPromise(Hex.toBytes("0x1234"))
    expect(result).toEqual(new Uint8Array([0x12, 0x34]))
  })

  it('handles empty hex', async () => {
    const result = await Effect.runPromise(Hex.toBytes("0x"))
    expect(result).toEqual(new Uint8Array(0))
  })

  it('fails on invalid hex format', async () => {
    const result = await Effect.runPromiseExit(Hex.toBytes("invalid"))
    expect(result._tag).toBe("Failure")
  })

  it('fails on odd length hex', async () => {
    const result = await Effect.runPromiseExit(Hex.toBytes("0x123"))
    expect(result._tag).toBe("Failure")
  })
})

describe('Hex.size', () => {
  it('returns byte size', async () => {
    const result = await Effect.runPromise(Hex.size("0x1234"))
    expect(result).toBe(2)
  })

  it('returns 0 for empty hex', async () => {
    const result = await Effect.runPromise(Hex.size("0x"))
    expect(result).toBe(0)
  })

  it('returns correct size for 32 bytes', async () => {
    const hex = "0x" + "00".repeat(32)
    const result = await Effect.runPromise(Hex.size(hex))
    expect(result).toBe(32)
  })
})
