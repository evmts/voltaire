import { describe, it, expect } from 'vitest'
import * as ErrorSignature from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('ErrorSignatureSchema', () => {
  it('decodes valid hex string', () => {
    const result = Schema.decodeSync(ErrorSignature.ErrorSignatureSchema)('0xcf479181')
    expect(result.length).toBe(4)
  })

  it('decodes 4-byte Uint8Array', () => {
    const input = new Uint8Array([0xcf, 0x47, 0x91, 0x81])
    const result = Schema.decodeSync(ErrorSignature.ErrorSignatureSchema)(input)
    expect(result).toEqual(input)
  })

  it('fails on wrong size', () => {
    expect(() => Schema.decodeSync(ErrorSignature.ErrorSignatureSchema)('0x1234')).toThrow()
  })

  it('encodes back to hex', () => {
    const decoded = Schema.decodeSync(ErrorSignature.ErrorSignatureSchema)('0xcf479181')
    const encoded = Schema.encodeSync(ErrorSignature.ErrorSignatureSchema)(decoded)
    expect(encoded).toBe('0xcf479181')
  })
})

describe('ErrorSignature.from', () => {
  it('creates from hex', async () => {
    const result = await Effect.runPromise(ErrorSignature.from('0xcf479181'))
    expect(result.length).toBe(4)
  })

  it('creates from Uint8Array', async () => {
    const input = new Uint8Array([0xcf, 0x47, 0x91, 0x81])
    const result = await Effect.runPromise(ErrorSignature.from(input))
    expect(result).toEqual(input)
  })

  it('fails on wrong length', async () => {
    const result = await Effect.runPromiseExit(ErrorSignature.from('0x12'))
    expect(result._tag).toBe('Failure')
  })
})

describe('ErrorSignature.fromHex', () => {
  it('creates from hex string', async () => {
    const result = await Effect.runPromise(ErrorSignature.fromHex('0xcf479181'))
    expect(result.length).toBe(4)
  })

  it('fails on invalid hex', async () => {
    const result = await Effect.runPromiseExit(ErrorSignature.fromHex('invalid'))
    expect(result._tag).toBe('Failure')
  })
})

describe('ErrorSignature.fromSignature', () => {
  it('computes error signature from string', async () => {
    const result = await Effect.runPromise(ErrorSignature.fromSignature('InsufficientBalance(uint256,uint256)'))
    expect(result.length).toBe(4)
  })

  it('computes Error(string) signature', async () => {
    const result = await Effect.runPromise(ErrorSignature.fromSignature('Error(string)'))
    const hex = await Effect.runPromise(ErrorSignature.toHex(result))
    expect(hex).toBe('0x08c379a0')
  })
})

describe('ErrorSignature.toHex', () => {
  it('converts to hex', async () => {
    const sig = await Effect.runPromise(ErrorSignature.from('0xcf479181'))
    const hex = await Effect.runPromise(ErrorSignature.toHex(sig))
    expect(hex).toBe('0xcf479181')
  })
})

describe('ErrorSignature.equals', () => {
  it('returns true for equal signatures', async () => {
    const a = await Effect.runPromise(ErrorSignature.from('0xcf479181'))
    const b = await Effect.runPromise(ErrorSignature.from('0xcf479181'))
    const result = await Effect.runPromise(ErrorSignature.equals(a, b))
    expect(result).toBe(true)
  })

  it('returns false for different signatures', async () => {
    const a = await Effect.runPromise(ErrorSignature.from('0xcf479181'))
    const b = await Effect.runPromise(ErrorSignature.from('0x08c379a0'))
    const result = await Effect.runPromise(ErrorSignature.equals(a, b))
    expect(result).toBe(false)
  })
})
