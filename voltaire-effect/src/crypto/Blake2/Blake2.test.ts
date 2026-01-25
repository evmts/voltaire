import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import { Blake2Service, Blake2Live, Blake2Test, hash } from './index.js'

describe('Blake2Service', () => {
  describe('Blake2Live', () => {
    it('hashes data using Voltaire Blake2', async () => {
      const program = Effect.gen(function* () {
        const blake2 = yield* Blake2Service
        return yield* blake2.hash(new Uint8Array([1, 2, 3]))
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Blake2Live))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })

    it('supports custom output length', async () => {
      const program = Effect.gen(function* () {
        const blake2 = yield* Blake2Service
        return yield* blake2.hash(new Uint8Array([1, 2, 3]), 32)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Blake2Live))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('produces correct hash for known input', async () => {
      const program = Effect.gen(function* () {
        const blake2 = yield* Blake2Service
        return yield* blake2.hash(new Uint8Array([]))
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Blake2Live))
      )

      // BLAKE2b-512 of empty input starts with 0x78, 0x6a
      expect(result[0]).toBe(0x78)
      expect(result[1]).toBe(0x6a)
    })
  })

  describe('Blake2Test', () => {
    it('returns deterministic zero-filled hash', async () => {
      const program = Effect.gen(function* () {
        const blake2 = yield* Blake2Service
        return yield* blake2.hash(new Uint8Array([1, 2, 3]))
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Blake2Test))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
      expect(result.every(b => b === 0)).toBe(true)
    })

    it('respects custom output length in test layer', async () => {
      const program = Effect.gen(function* () {
        const blake2 = yield* Blake2Service
        return yield* blake2.hash(new Uint8Array([1, 2, 3]), 32)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Blake2Test))
      )

      expect(result.length).toBe(32)
      expect(result.every(b => b === 0)).toBe(true)
    })
  })
})

describe('hash', () => {
  it('hashes data with Blake2Service dependency', async () => {
    const data = new Uint8Array([104, 101, 108, 108, 111]) // "hello"
    const result = await Effect.runPromise(
      hash(data).pipe(Effect.provide(Blake2Live))
    )

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(64)
  })

  it('supports custom output length', async () => {
    const data = new Uint8Array([104, 101, 108, 108, 111])
    const result = await Effect.runPromise(
      hash(data, 32).pipe(Effect.provide(Blake2Live))
    )

    expect(result.length).toBe(32)
  })

  it('works with test layer', async () => {
    const data = new Uint8Array([1, 2, 3])
    const result = await Effect.runPromise(
      hash(data).pipe(Effect.provide(Blake2Test))
    )

    expect(result.every(b => b === 0)).toBe(true)
  })
})
