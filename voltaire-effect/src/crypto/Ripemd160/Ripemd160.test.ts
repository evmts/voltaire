import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import { Ripemd160Service, Ripemd160Live, Ripemd160Test, hash } from './index.js'

describe('Ripemd160Service', () => {
  describe('Ripemd160Live', () => {
    it('hashes data using Voltaire Ripemd160', async () => {
      const program = Effect.gen(function* () {
        const ripemd160 = yield* Ripemd160Service
        return yield* ripemd160.hash(new Uint8Array([1, 2, 3]))
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Ripemd160Live))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(20)
    })

    it('produces correct hash for known input', async () => {
      const program = Effect.gen(function* () {
        const ripemd160 = yield* Ripemd160Service
        return yield* ripemd160.hash(new Uint8Array([]))
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Ripemd160Live))
      )

      // RIPEMD160 of empty input: 9c1185a5c5e9fc54612808977ee8f548b2258d31
      expect(result[0]).toBe(0x9c)
      expect(result[1]).toBe(0x11)
    })
  })

  describe('Ripemd160Test', () => {
    it('returns deterministic zero-filled hash', async () => {
      const program = Effect.gen(function* () {
        const ripemd160 = yield* Ripemd160Service
        return yield* ripemd160.hash(new Uint8Array([1, 2, 3]))
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Ripemd160Test))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(20)
      expect(result.every(b => b === 0)).toBe(true)
    })
  })
})

describe('hash', () => {
  it('hashes data with Ripemd160Service dependency', async () => {
    const data = new Uint8Array([104, 101, 108, 108, 111]) // "hello"
    const result = await Effect.runPromise(
      hash(data).pipe(Effect.provide(Ripemd160Live))
    )

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(20)
  })

  it('works with test layer', async () => {
    const data = new Uint8Array([1, 2, 3])
    const result = await Effect.runPromise(
      hash(data).pipe(Effect.provide(Ripemd160Test))
    )

    expect(result.every(b => b === 0)).toBe(true)
  })
})
