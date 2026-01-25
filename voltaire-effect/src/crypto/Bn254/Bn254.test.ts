import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import { Bn254Service, Bn254Live, Bn254Test, g1Add, g1Mul, g1Generator, g2Generator, pairingCheck } from './index.js'

describe('Bn254Service', () => {
  describe('Bn254Live', () => {
    it('generates G1 generator point', async () => {
      const program = Effect.gen(function* () {
        const bn254 = yield* Bn254Service
        return yield* bn254.g1Generator()
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bn254Live))
      )

      expect(result).toHaveProperty('x')
      expect(result).toHaveProperty('y')
      expect(result).toHaveProperty('z')
      expect(typeof result.x).toBe('bigint')
    })

    it('generates G2 generator point', async () => {
      const program = Effect.gen(function* () {
        const bn254 = yield* Bn254Service
        return yield* bn254.g2Generator()
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bn254Live))
      )

      expect(result).toHaveProperty('x')
      expect(result).toHaveProperty('y')
      expect(result).toHaveProperty('z')
    })

    it('adds G1 points', async () => {
      const program = Effect.gen(function* () {
        const bn254 = yield* Bn254Service
        const g1 = yield* bn254.g1Generator()
        return yield* bn254.g1Add(g1, g1)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bn254Live))
      )

      expect(result).toHaveProperty('x')
    })

    it('multiplies G1 point by scalar', async () => {
      const program = Effect.gen(function* () {
        const bn254 = yield* Bn254Service
        const g1 = yield* bn254.g1Generator()
        return yield* bn254.g1Mul(g1, 5n)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bn254Live))
      )

      expect(result).toHaveProperty('x')
    })

    it('performs pairing check', async () => {
      const program = Effect.gen(function* () {
        const bn254 = yield* Bn254Service
        const g1 = yield* bn254.g1Generator()
        const g2 = yield* bn254.g2Generator()
        const negG1 = yield* bn254.g1Mul(g1, -1n)
        return yield* bn254.pairingCheck([[g1, g2], [negG1, g2]])
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bn254Live))
      )

      expect(typeof result).toBe('boolean')
    })
  })

  describe('Bn254Test', () => {
    it('returns mock G1 point', async () => {
      const program = Effect.gen(function* () {
        const bn254 = yield* Bn254Service
        return yield* bn254.g1Generator()
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bn254Test))
      )

      expect(result).toHaveProperty('x')
      expect(result).toHaveProperty('y')
    })

    it('returns true for pairing check', async () => {
      const program = Effect.gen(function* () {
        const bn254 = yield* Bn254Service
        const g1 = yield* bn254.g1Generator()
        const g2 = yield* bn254.g2Generator()
        return yield* bn254.pairingCheck([[g1, g2]])
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bn254Test))
      )

      expect(result).toBe(true)
    })
  })
})

describe('convenience functions', () => {
  it('g1Generator works with service dependency', async () => {
    const result = await Effect.runPromise(
      g1Generator().pipe(Effect.provide(Bn254Live))
    )
    expect(result).toHaveProperty('x')
  })

  it('g2Generator works with service dependency', async () => {
    const result = await Effect.runPromise(
      g2Generator().pipe(Effect.provide(Bn254Live))
    )
    expect(result).toHaveProperty('x')
  })

  it('g1Add works with service dependency', async () => {
    const program = Effect.gen(function* () {
      const g1 = yield* g1Generator()
      return yield* g1Add(g1, g1)
    })

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(Bn254Live))
    )
    expect(result).toHaveProperty('x')
  })

  it('g1Mul works with service dependency', async () => {
    const program = Effect.gen(function* () {
      const g1 = yield* g1Generator()
      return yield* g1Mul(g1, 3n)
    })

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(Bn254Live))
    )
    expect(result).toHaveProperty('x')
  })

  it('pairingCheck works with service dependency', async () => {
    const program = Effect.gen(function* () {
      const g1 = yield* g1Generator()
      const g2 = yield* g2Generator()
      return yield* pairingCheck([[g1, g2]])
    })

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(Bn254Live))
    )
    expect(typeof result).toBe('boolean')
  })
})
