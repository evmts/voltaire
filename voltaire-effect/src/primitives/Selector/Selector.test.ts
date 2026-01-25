import { describe, it, expect } from 'vitest'
import * as Selector from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('SelectorSchema', () => {
  it('decodes valid hex string', () => {
    const result = Schema.decodeSync(Selector.SelectorSchema)('0xa9059cbb')
    expect(result.length).toBe(4)
  })

  it('decodes 4-byte Uint8Array', () => {
    const input = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb])
    const result = Schema.decodeSync(Selector.SelectorSchema)(input)
    expect(result).toEqual(input)
  })

  it('fails on wrong size', () => {
    expect(() => Schema.decodeSync(Selector.SelectorSchema)('0x1234')).toThrow()
  })

  it('fails on wrong length bytes', () => {
    const input = new Uint8Array([0xa9, 0x05])
    expect(() => Schema.decodeSync(Selector.SelectorSchema)(input)).toThrow()
  })
})

describe('Selector.from', () => {
  it('creates selector from hex', async () => {
    const result = await Effect.runPromise(Selector.from('0xa9059cbb'))
    expect(result.length).toBe(4)
  })

  it('creates selector from Uint8Array', async () => {
    const input = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb])
    const result = await Effect.runPromise(Selector.from(input))
    expect(result).toEqual(input)
  })

  it('fails on wrong length', async () => {
    const result = await Effect.runPromiseExit(Selector.from('0x1234'))
    expect(result._tag).toBe('Failure')
  })
})

describe('Selector.fromHex', () => {
  it('creates selector from hex string', async () => {
    const result = await Effect.runPromise(Selector.fromHex('0xa9059cbb'))
    expect(result.length).toBe(4)
  })

  it('fails on invalid hex', async () => {
    const result = await Effect.runPromiseExit(Selector.fromHex('0x12'))
    expect(result._tag).toBe('Failure')
  })
})

describe('Selector.fromSignature', () => {
  it('computes selector from function signature', async () => {
    const result = await Effect.runPromise(Selector.fromSignature('transfer(address,uint256)'))
    expect(result.length).toBe(4)
    const hex = await Effect.runPromise(Selector.toHex(result))
    expect(hex).toBe('0xa9059cbb')
  })

  it('computes selector for balanceOf', async () => {
    const result = await Effect.runPromise(Selector.fromSignature('balanceOf(address)'))
    const hex = await Effect.runPromise(Selector.toHex(result))
    expect(hex).toBe('0x70a08231')
  })
})

describe('Selector.toHex', () => {
  it('converts selector to hex', async () => {
    const selector = await Effect.runPromise(Selector.from('0xa9059cbb'))
    const hex = await Effect.runPromise(Selector.toHex(selector))
    expect(hex).toBe('0xa9059cbb')
  })
})

describe('Selector.equals', () => {
  it('returns true for equal selectors', async () => {
    const a = await Effect.runPromise(Selector.from('0xa9059cbb'))
    const b = await Effect.runPromise(Selector.from('0xa9059cbb'))
    const result = await Effect.runPromise(Selector.equals(a, b))
    expect(result).toBe(true)
  })

  it('returns false for different selectors', async () => {
    const a = await Effect.runPromise(Selector.from('0xa9059cbb'))
    const b = await Effect.runPromise(Selector.from('0x70a08231'))
    const result = await Effect.runPromise(Selector.equals(a, b))
    expect(result).toBe(false)
  })
})
