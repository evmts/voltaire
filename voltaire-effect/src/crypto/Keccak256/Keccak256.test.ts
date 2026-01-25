import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import { KeccakService, KeccakLive, KeccakTest, hash } from './index.js'

describe('KeccakService', () => {
  describe('KeccakLive', () => {
    it('hashes data using Voltaire Keccak256', async () => {
      const program = Effect.gen(function* () {
        const keccak = yield* KeccakService
        return yield* keccak.hash(new Uint8Array([1, 2, 3]))
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(KeccakLive))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('produces correct hash for known input', async () => {
      const program = Effect.gen(function* () {
        const keccak = yield* KeccakService
        return yield* keccak.hash(new Uint8Array([]))
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(KeccakLive))
      )

      // keccak256 of empty input
      expect(result[0]).toBe(0xc5)
      expect(result[1]).toBe(0xd2)
    })
  })

  describe('KeccakTest', () => {
    it('returns deterministic zero-filled hash', async () => {
      const program = Effect.gen(function* () {
        const keccak = yield* KeccakService
        return yield* keccak.hash(new Uint8Array([1, 2, 3]))
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(KeccakTest))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
      expect(result.every(b => b === 0)).toBe(true)
    })
  })
})

describe('hash', () => {
  it('hashes data with KeccakService dependency', async () => {
    const data = new Uint8Array([104, 101, 108, 108, 111]) // "hello"
    const result = await Effect.runPromise(
      hash(data).pipe(Effect.provide(KeccakLive))
    )

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('works with test layer', async () => {
    const data = new Uint8Array([1, 2, 3])
    const result = await Effect.runPromise(
      hash(data).pipe(Effect.provide(KeccakTest))
    )

    expect(result.every(b => b === 0)).toBe(true)
  })
})
