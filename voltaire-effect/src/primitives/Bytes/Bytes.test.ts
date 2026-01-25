import { describe, it, expect } from 'vitest'
import * as Bytes from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('Bytes Schema', () => {
  it('decodes Uint8Array', () => {
    const input = new Uint8Array([0x01, 0x02, 0x03])
    const result = Schema.decodeSync(Bytes.Schema)(input)
    expect(result).toEqual(input)
  })

  it('decodes hex string', () => {
    const result = Schema.decodeSync(Bytes.Schema)("0x1234")
    expect(result).toEqual(new Uint8Array([0x12, 0x34]))
  })

  it('decodes number array', () => {
    const result = Schema.decodeSync(Bytes.Schema)([0x01, 0x02, 0x03])
    expect(result).toEqual(new Uint8Array([0x01, 0x02, 0x03]))
  })

  it('decodes UTF-8 string', () => {
    const result = Schema.decodeSync(Bytes.Schema)("hello")
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('Bytes.from', () => {
  it('creates bytes from Uint8Array', async () => {
    const input = new Uint8Array([0x01, 0x02])
    const result = await Effect.runPromise(Bytes.from(input))
    expect(result).toEqual(input)
  })

  it('creates bytes from hex string', async () => {
    const result = await Effect.runPromise(Bytes.from("0x1234"))
    expect(result).toEqual(new Uint8Array([0x12, 0x34]))
  })

  it('creates bytes from number array', async () => {
    const result = await Effect.runPromise(Bytes.from([0x01, 0x02, 0x03]))
    expect(result).toEqual(new Uint8Array([0x01, 0x02, 0x03]))
  })

  it('creates bytes from UTF-8 string', async () => {
    const result = await Effect.runPromise(Bytes.from("hello"))
    expect(result.length).toBe(5)
  })

  it('handles empty input', async () => {
    const result = await Effect.runPromise(Bytes.from(new Uint8Array(0)))
    expect(result).toEqual(new Uint8Array(0))
  })
})
