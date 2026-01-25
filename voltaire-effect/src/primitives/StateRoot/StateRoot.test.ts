import { describe, it, expect } from 'vitest'
import * as StateRoot from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('StateRoot Schema', () => {
  it('decodes valid hex string', () => {
    const hex = '0x' + '12'.repeat(32)
    const result = Schema.decodeSync(StateRoot.StateRootSchema)(hex)
    expect(result.length).toBe(32)
  })

  it('decodes 32-byte Uint8Array', () => {
    const input = new Uint8Array(32).fill(0x42)
    const result = Schema.decodeSync(StateRoot.StateRootSchema)(input)
    expect(result).toEqual(input)
  })

  it('decodes bigint', () => {
    const result = Schema.decodeSync(StateRoot.StateRootSchema)(42n)
    expect(result.length).toBe(32)
  })

  it('decodes number', () => {
    const result = Schema.decodeSync(StateRoot.StateRootSchema)(42)
    expect(result.length).toBe(32)
  })

  it('fails on wrong size', () => {
    const hex = '0x1234'
    expect(() => Schema.decodeSync(StateRoot.StateRootSchema)(hex)).toThrow()
  })

  it('decodes empty state root (all zeros)', () => {
    const hex = '0x' + '00'.repeat(32)
    const result = Schema.decodeSync(StateRoot.StateRootSchema)(hex)
    expect(result.length).toBe(32)
    expect(result.every((b: number) => b === 0)).toBe(true)
  })
})

describe('StateRoot.from', () => {
  it('creates state root from valid hex', async () => {
    const hex = '0x' + '00'.repeat(32)
    const result = await Effect.runPromise(StateRoot.from(hex))
    expect(result.length).toBe(32)
  })

  it('creates state root from Uint8Array', async () => {
    const input = new Uint8Array(32).fill(0xff)
    const result = await Effect.runPromise(StateRoot.from(input))
    expect(result).toEqual(input)
  })

  it('creates state root from bigint', async () => {
    const result = await Effect.runPromise(StateRoot.from(123456789n))
    expect(result.length).toBe(32)
  })

  it('creates state root from number', async () => {
    const result = await Effect.runPromise(StateRoot.from(42))
    expect(result.length).toBe(32)
  })

  it('fails on wrong length hex', async () => {
    const result = await Effect.runPromiseExit(StateRoot.from('0x1234'))
    expect(result._tag).toBe('Failure')
  })

  it('fails on wrong length bytes', async () => {
    const result = await Effect.runPromiseExit(StateRoot.from(new Uint8Array(16)))
    expect(result._tag).toBe('Failure')
  })
})

describe('StateRoot.empty', () => {
  it('creates empty state root (all zeros)', () => {
    const result = StateRoot.empty()
    expect(result.length).toBe(32)
    expect(result.every((b: number) => b === 0)).toBe(true)
  })
})
