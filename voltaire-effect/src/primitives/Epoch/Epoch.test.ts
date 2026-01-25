import { describe, it, expect } from 'vitest'
import * as Epoch from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('EpochSchema', () => {
  it('decodes from bigint', () => {
    const result = Schema.decodeSync(Epoch.EpochSchema)(100n)
    expect(result).toBe(100n)
  })

  it('decodes from number', () => {
    const result = Schema.decodeSync(Epoch.EpochSchema)(100)
    expect(result).toBe(100n)
  })

  it('decodes from string', () => {
    const result = Schema.decodeSync(Epoch.EpochSchema)('100')
    expect(result).toBe(100n)
  })

  it('encodes back to bigint', () => {
    const decoded = Schema.decodeSync(Epoch.EpochSchema)(100n)
    const encoded = Schema.encodeSync(Epoch.EpochSchema)(decoded)
    expect(encoded).toBe(100n)
  })
})

describe('Epoch.from', () => {
  it('creates from bigint', async () => {
    const result = await Effect.runPromise(Epoch.from(200n))
    expect(result).toBe(200n)
  })

  it('creates from number', async () => {
    const result = await Effect.runPromise(Epoch.from(200))
    expect(result).toBe(200n)
  })
})

describe('Epoch.toNumber', () => {
  it('converts to number', async () => {
    const epoch = await Effect.runPromise(Epoch.from(100n))
    const result = await Effect.runPromise(Epoch.toNumber(epoch))
    expect(result).toBe(100)
  })
})

describe('Epoch.toBigInt', () => {
  it('converts to bigint', async () => {
    const epoch = await Effect.runPromise(Epoch.from(100))
    const result = await Effect.runPromise(Epoch.toBigInt(epoch))
    expect(result).toBe(100n)
  })
})

describe('Epoch.equals', () => {
  it('returns true for equal epochs', async () => {
    const a = await Effect.runPromise(Epoch.from(100n))
    const b = await Effect.runPromise(Epoch.from(100n))
    const result = await Effect.runPromise(Epoch.equals(a, b))
    expect(result).toBe(true)
  })

  it('returns false for different epochs', async () => {
    const a = await Effect.runPromise(Epoch.from(100n))
    const b = await Effect.runPromise(Epoch.from(200n))
    const result = await Effect.runPromise(Epoch.equals(a, b))
    expect(result).toBe(false)
  })
})

describe('Epoch.toSlot', () => {
  it('converts epoch to first slot', async () => {
    const epoch = await Effect.runPromise(Epoch.from(1n))
    const slot = await Effect.runPromise(Epoch.toSlot(epoch))
    expect(slot).toBe(32n)
  })

  it('returns 0 for epoch 0', async () => {
    const epoch = await Effect.runPromise(Epoch.from(0n))
    const slot = await Effect.runPromise(Epoch.toSlot(epoch))
    expect(slot).toBe(0n)
  })
})
