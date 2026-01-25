import { describe, it, expect } from 'vitest'
import * as Ens from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('EnsSchema', () => {
  it('decodes valid ENS name', () => {
    const result = Schema.decodeSync(Ens.EnsSchema)('vitalik.eth')
    expect(result).toBe('vitalik.eth')
  })

  it('encodes back to string', () => {
    const decoded = Schema.decodeSync(Ens.EnsSchema)('vitalik.eth')
    const encoded = Schema.encodeSync(Ens.EnsSchema)(decoded)
    expect(encoded).toBe('vitalik.eth')
  })
})

describe('Ens.from', () => {
  it('creates ENS name', async () => {
    const result = await Effect.runPromise(Ens.from('vitalik.eth'))
    expect(result).toBe('vitalik.eth')
  })
})

describe('Ens.normalize', () => {
  it('normalizes ENS name', async () => {
    const result = await Effect.runPromise(Ens.normalize('VITALIK.eth'))
    expect(result).toBe('vitalik.eth')
  })
})

describe('Ens.namehash', () => {
  it('computes namehash', async () => {
    const result = await Effect.runPromise(Ens.namehash('vitalik.eth'))
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('returns zero hash for empty string', async () => {
    const result = await Effect.runPromise(Ens.namehash(''))
    expect(result).toEqual(new Uint8Array(32))
  })
})

describe('Ens.labelhash', () => {
  it('computes labelhash', async () => {
    const result = await Effect.runPromise(Ens.labelhash('vitalik'))
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })
})

describe('Ens.isValid', () => {
  it('returns true for valid ENS name', async () => {
    const result = await Effect.runPromise(Ens.isValid('vitalik.eth'))
    expect(result).toBe(true)
  })
})

describe('Ens.is', () => {
  it('returns true for ENS type', async () => {
    const ens = await Effect.runPromise(Ens.from('test.eth'))
    const result = await Effect.runPromise(Ens.is(ens))
    expect(result).toBe(true)
  })

  it('returns false for non-ENS value', async () => {
    const result = await Effect.runPromise(Ens.is(123))
    expect(result).toBe(false)
  })
})

describe('Ens.toString', () => {
  it('converts ENS to string', async () => {
    const ens = await Effect.runPromise(Ens.from('test.eth'))
    const result = await Effect.runPromise(Ens.toString(ens))
    expect(result).toBe('test.eth')
  })
})
