import { describe, it, expect } from 'vitest'
import * as InitCode from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('InitCode Schema', () => {
  it('decodes Uint8Array', () => {
    const input = new Uint8Array([0x60, 0x80, 0x60, 0x40, 0x52])
    const result = Schema.decodeSync(InitCode.Schema)(input)
    expect([...result]).toEqual([...input])
  })

  it('decodes hex string', () => {
    const result = Schema.decodeSync(InitCode.Schema)("0x6080604052")
    expect([...result]).toEqual([0x60, 0x80, 0x60, 0x40, 0x52])
  })

  it('fails on invalid input', () => {
    expect(() => Schema.decodeSync(InitCode.Schema)(123 as unknown as string)).toThrow()
  })
})

describe('InitCode.from', () => {
  it('creates init code from Uint8Array', async () => {
    const input = new Uint8Array([0x60, 0x80, 0x60, 0x40])
    const result = await Effect.runPromise(InitCode.from(input))
    expect([...result]).toEqual([...input])
  })

  it('creates init code from hex string', async () => {
    const result = await Effect.runPromise(InitCode.from("0x60806040"))
    expect([...result]).toEqual([0x60, 0x80, 0x60, 0x40])
  })

  it('handles empty init code', async () => {
    const result = await Effect.runPromise(InitCode.from(new Uint8Array(0)))
    expect(result.length).toBe(0)
  })

  it('handles empty hex string', async () => {
    const result = await Effect.runPromise(InitCode.from("0x"))
    expect(result.length).toBe(0)
  })
})
