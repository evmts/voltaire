import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import { SHA256Service, SHA256Live, SHA256Test, hash } from './index.js'

describe('SHA256Service', () => {
  describe('SHA256Live', () => {
    it('hashes data using Voltaire SHA256', async () => {
      const program = Effect.gen(function* () {
        const sha256 = yield* SHA256Service
        return yield* sha256.hash(new Uint8Array([1, 2, 3]))
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(SHA256Live))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('produces correct hash for known input', async () => {
      const program = Effect.gen(function* () {
        const sha256 = yield* SHA256Service
        return yield* sha256.hash(new Uint8Array([]))
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(SHA256Live))
      )

      // SHA256 of empty input: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
      expect(result[0]).toBe(0xe3)
      expect(result[1]).toBe(0xb0)
    })
  })

  describe('SHA256Test', () => {
    it('returns deterministic zero-filled hash', async () => {
      const program = Effect.gen(function* () {
        const sha256 = yield* SHA256Service
        return yield* sha256.hash(new Uint8Array([1, 2, 3]))
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(SHA256Test))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
      expect(result.every(b => b === 0)).toBe(true)
    })
  })
})

describe('hash', () => {
  it('hashes data with SHA256Service dependency', async () => {
    const data = new Uint8Array([104, 101, 108, 108, 111]) // "hello"
    const result = await Effect.runPromise(
      hash(data).pipe(Effect.provide(SHA256Live))
    )

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('works with test layer', async () => {
    const data = new Uint8Array([1, 2, 3])
    const result = await Effect.runPromise(
      hash(data).pipe(Effect.provide(SHA256Test))
    )

    expect(result.every(b => b === 0)).toBe(true)
  })
})
