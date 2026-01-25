import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import { ModExpService, ModExpLive, ModExpTest, modexp, modexpBytes, calculateGas } from './index.js'

describe('ModExpService', () => {
  describe('ModExpLive', () => {
    it('computes 2^10 mod 1000 = 24', async () => {
      const program = Effect.gen(function* () {
        const service = yield* ModExpService
        return yield* service.modexp(2n, 10n, 1000n)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ModExpLive))
      )

      expect(result).toBe(24n)
    })

    it('computes 3^13 mod 17 = 12', async () => {
      const program = Effect.gen(function* () {
        const service = yield* ModExpService
        return yield* service.modexp(3n, 13n, 17n)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ModExpLive))
      )

      expect(result).toBe(12n)
    })

    it('handles zero exponent', async () => {
      const program = Effect.gen(function* () {
        const service = yield* ModExpService
        return yield* service.modexp(5n, 0n, 7n)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ModExpLive))
      )

      expect(result).toBe(1n)
    })

    it('handles zero base', async () => {
      const program = Effect.gen(function* () {
        const service = yield* ModExpService
        return yield* service.modexp(0n, 5n, 7n)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ModExpLive))
      )

      expect(result).toBe(0n)
    })

    it('handles modulus of 1', async () => {
      const program = Effect.gen(function* () {
        const service = yield* ModExpService
        return yield* service.modexp(5n, 3n, 1n)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ModExpLive))
      )

      expect(result).toBe(0n)
    })
  })

  describe('modexpBytes', () => {
    it('computes 2^3 mod 5 = 3 with byte arrays', async () => {
      const program = Effect.gen(function* () {
        const service = yield* ModExpService
        return yield* service.modexpBytes(
          new Uint8Array([0x02]),
          new Uint8Array([0x03]),
          new Uint8Array([0x05])
        )
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ModExpLive))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(1)
      expect(result[0]).toBe(0x03)
    })

    it('pads output to modulus length', async () => {
      const program = Effect.gen(function* () {
        const service = yield* ModExpService
        return yield* service.modexpBytes(
          new Uint8Array([0x02]),
          new Uint8Array([0x0a]),
          new Uint8Array([0x03, 0xe8])
        )
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ModExpLive))
      )

      expect(result.length).toBe(2)
    })
  })

  describe('calculateGas', () => {
    it('returns minimum gas of 200', async () => {
      const program = Effect.gen(function* () {
        const service = yield* ModExpService
        return yield* service.calculateGas(1n, 1n, 1n, 3n)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ModExpLive))
      )

      expect(result).toBe(200n)
    })

    it('calculates gas for larger inputs', async () => {
      const program = Effect.gen(function* () {
        const service = yield* ModExpService
        return yield* service.calculateGas(64n, 64n, 64n, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ModExpLive))
      )

      expect(result).toBeGreaterThan(200n)
    })
  })

  describe('ModExpTest', () => {
    it('returns deterministic zero result', async () => {
      const program = Effect.gen(function* () {
        const service = yield* ModExpService
        return yield* service.modexp(2n, 10n, 1000n)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ModExpTest))
      )

      expect(result).toBe(0n)
    })

    it('returns zero-filled bytes for modexpBytes', async () => {
      const program = Effect.gen(function* () {
        const service = yield* ModExpService
        return yield* service.modexpBytes(
          new Uint8Array([0x02]),
          new Uint8Array([0x03]),
          new Uint8Array([0x05])
        )
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ModExpTest))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(1)
      expect(result[0]).toBe(0)
    })

    it('returns minimum gas for calculateGas', async () => {
      const program = Effect.gen(function* () {
        const service = yield* ModExpService
        return yield* service.calculateGas(64n, 64n, 64n, 255n)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ModExpTest))
      )

      expect(result).toBe(200n)
    })
  })
})

describe('operations', () => {
  describe('modexp', () => {
    it('computes modular exponentiation with service dependency', async () => {
      const result = await Effect.runPromise(
        modexp(2n, 10n, 1000n).pipe(Effect.provide(ModExpLive))
      )

      expect(result).toBe(24n)
    })

    it('works with test layer', async () => {
      const result = await Effect.runPromise(
        modexp(2n, 10n, 1000n).pipe(Effect.provide(ModExpTest))
      )

      expect(result).toBe(0n)
    })
  })

  describe('modexpBytes', () => {
    it('computes with byte arrays using service', async () => {
      const result = await Effect.runPromise(
        modexpBytes(
          new Uint8Array([0x02]),
          new Uint8Array([0x03]),
          new Uint8Array([0x05])
        ).pipe(Effect.provide(ModExpLive))
      )

      expect(result[0]).toBe(0x03)
    })
  })

  describe('calculateGas', () => {
    it('calculates gas using service', async () => {
      const result = await Effect.runPromise(
        calculateGas(1n, 1n, 1n, 3n).pipe(Effect.provide(ModExpLive))
      )

      expect(result).toBe(200n)
    })
  })
})
