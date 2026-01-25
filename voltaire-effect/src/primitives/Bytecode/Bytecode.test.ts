import { describe, it, expect } from 'vitest'
import * as Bytecode from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('Bytecode Schema', () => {
  it('decodes Uint8Array', () => {
    const input = new Uint8Array([0x60, 0x01, 0x60, 0x02])
    const result = Schema.decodeSync(Bytecode.Schema)(input)
    expect([...result]).toEqual([...input])
  })

  it('decodes hex string', () => {
    const result = Schema.decodeSync(Bytecode.Schema)("0x60016002")
    expect([...result]).toEqual([0x60, 0x01, 0x60, 0x02])
  })

  it('fails on invalid input', () => {
    expect(() => Schema.decodeSync(Bytecode.Schema)(123 as unknown as string)).toThrow()
  })
})

describe('Bytecode.from', () => {
  it('creates bytecode from Uint8Array', async () => {
    const input = new Uint8Array([0x60, 0x01])
    const result = await Effect.runPromise(Bytecode.from(input))
    expect([...result]).toEqual([...input])
  })

  it('creates bytecode from hex string', async () => {
    const result = await Effect.runPromise(Bytecode.from("0x6001"))
    expect([...result]).toEqual([0x60, 0x01])
  })

  it('handles empty bytecode', async () => {
    const result = await Effect.runPromise(Bytecode.from(new Uint8Array(0)))
    expect(result.length).toBe(0)
  })

  it('handles empty hex string', async () => {
    const result = await Effect.runPromise(Bytecode.from("0x"))
    expect(result.length).toBe(0)
  })
})
