import { describe, it, expect } from 'vitest'
import * as ContractCode from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('ContractCode Schema', () => {
  it('decodes Uint8Array', () => {
    const input = new Uint8Array([0x60, 0x80, 0x60, 0x40])
    const result = Schema.decodeSync(ContractCode.Schema)(input)
    expect([...result]).toEqual([...input])
  })

  it('decodes hex string', () => {
    const result = Schema.decodeSync(ContractCode.Schema)("0x60806040")
    expect([...result]).toEqual([0x60, 0x80, 0x60, 0x40])
  })

  it('fails on invalid input', () => {
    expect(() => Schema.decodeSync(ContractCode.Schema)(123 as unknown as string)).toThrow()
  })
})

describe('ContractCode.from', () => {
  it('creates contract code from Uint8Array', async () => {
    const input = new Uint8Array([0x60, 0x80])
    const result = await Effect.runPromise(ContractCode.from(input))
    expect([...result]).toEqual([...input])
  })

  it('creates contract code from hex string', async () => {
    const result = await Effect.runPromise(ContractCode.from("0x6080"))
    expect([...result]).toEqual([0x60, 0x80])
  })

  it('handles empty contract code', async () => {
    const result = await Effect.runPromise(ContractCode.from(new Uint8Array(0)))
    expect(result.length).toBe(0)
  })

  it('handles empty hex string', async () => {
    const result = await Effect.runPromise(ContractCode.from("0x"))
    expect(result.length).toBe(0)
  })
})
