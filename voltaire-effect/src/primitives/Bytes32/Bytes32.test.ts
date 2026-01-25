import { describe, it, expect } from 'vitest'
import * as Bytes32 from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('Bytes32 Schema', () => {
  it('decodes valid hex string', () => {
    const hex = '0x' + '12'.repeat(32)
    const result = Schema.decodeSync(Bytes32.Schema)(hex)
    expect(result.length).toBe(32)
  })

  it('decodes 32-byte Uint8Array', () => {
    const input = new Uint8Array(32).fill(0x42)
    const result = Schema.decodeSync(Bytes32.Schema)(input)
    expect(result).toEqual(input)
  })

  it('decodes bigint', () => {
    const result = Schema.decodeSync(Bytes32.Schema)(42n)
    expect(result.length).toBe(32)
  })

  it('decodes number', () => {
    const result = Schema.decodeSync(Bytes32.Schema)(42)
    expect(result.length).toBe(32)
  })

  it('fails on wrong size', () => {
    const hex = '0x1234'
    expect(() => Schema.decodeSync(Bytes32.Schema)(hex)).toThrow()
  })
})

describe('Bytes32.from', () => {
  it('creates bytes32 from valid hex', async () => {
    const hex = '0x' + '00'.repeat(32)
    const result = await Effect.runPromise(Bytes32.from(hex))
    expect(result.length).toBe(32)
  })

  it('creates bytes32 from Uint8Array', async () => {
    const input = new Uint8Array(32).fill(0xff)
    const result = await Effect.runPromise(Bytes32.from(input))
    expect(result).toEqual(input)
  })

  it('creates bytes32 from bigint', async () => {
    const result = await Effect.runPromise(Bytes32.from(123456789n))
    expect(result.length).toBe(32)
  })

  it('creates bytes32 from number', async () => {
    const result = await Effect.runPromise(Bytes32.from(42))
    expect(result.length).toBe(32)
  })

  it('fails on wrong length hex', async () => {
    const result = await Effect.runPromiseExit(Bytes32.from('0x1234'))
    expect(result._tag).toBe('Failure')
  })

  it('fails on wrong length bytes', async () => {
    const result = await Effect.runPromiseExit(Bytes32.from(new Uint8Array(16)))
    expect(result._tag).toBe('Failure')
  })
})
