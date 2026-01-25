/**
 * @fileoverview ModExpService Effect service definition for modular exponentiation.
 * @module ModExp/ModExpService
 * @since 0.0.1
 */
import { ModExp } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

/**
 * Service interface for modular exponentiation operations.
 *
 * @description
 * Defines the contract for modular exponentiation implementations.
 * All methods return Effect types for composable, type-safe error handling.
 *
 * @since 0.0.1
 */
export interface ModExpServiceShape {
  /**
   * Computes base^exp mod modulus for arbitrary-precision integers.
   * @param base - Base value
   * @param exp - Exponent value
   * @param modulus - Modulus value (must be > 0)
   * @returns Effect containing the result
   */
  readonly modexp: (base: bigint, exp: bigint, modulus: bigint) => Effect.Effect<bigint>
  /**
   * Computes base^exp mod modulus with byte array inputs/outputs.
   * Output is padded to modulus length per EIP-198 spec.
   * @param baseBytes - Base as big-endian bytes
   * @param expBytes - Exponent as big-endian bytes
   * @param modBytes - Modulus as big-endian bytes
   * @returns Effect containing the result as big-endian bytes
   */
  readonly modexpBytes: (baseBytes: Uint8Array, expBytes: Uint8Array, modBytes: Uint8Array) => Effect.Effect<Uint8Array>
  /**
   * Calculate gas cost for MODEXP operation per EIP-2565.
   * @param baseLen - Length of base in bytes
   * @param expLen - Length of exponent in bytes
   * @param modLen - Length of modulus in bytes
   * @param expHead - First 32 bytes of exponent as BigInt
   * @returns Effect containing gas cost
   */
  readonly calculateGas: (baseLen: bigint, expLen: bigint, modLen: bigint, expHead: bigint) => Effect.Effect<bigint>
}

/**
 * Modular exponentiation service for Effect-based applications.
 * Computes base^exp mod modulus for arbitrary-precision integers.
 * Used by MODEXP precompile (0x05) per EIP-198/EIP-2565.
 *
 * @example
 * ```typescript
 * import { ModExpService, ModExpLive } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const modexp = yield* ModExpService
 *   return yield* modexp.modexp(2n, 10n, 1000n) // 24n
 * }).pipe(Effect.provide(ModExpLive))
 * ```
 * @since 0.0.1
 */
export class ModExpService extends Context.Tag("ModExpService")<
  ModExpService,
  ModExpServiceShape
>() {}

/**
 * Production layer for ModExpService using native ModExp implementation.
 *
 * @description
 * Provides real modular exponentiation using JavaScript's BigInt.
 * Implements EIP-198/EIP-2565 compatible calculations.
 *
 * @example
 * ```typescript
 * import { ModExpService, ModExpLive } from 'voltaire-effect/crypto/ModExp'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const svc = yield* ModExpService
 *   return yield* svc.modexp(2n, 10n, 1000n) // 24n
 * }).pipe(Effect.provide(ModExpLive))
 * ```
 *
 * @since 0.0.1
 * @see {@link ModExpTest} for unit testing
 */
export const ModExpLive = Layer.succeed(ModExpService, {
  modexp: (base, exp, modulus) => Effect.sync(() => ModExp.modexp(base, exp, modulus)),
  modexpBytes: (baseBytes, expBytes, modBytes) => Effect.sync(() => ModExp.modexpBytes(baseBytes, expBytes, modBytes)),
  calculateGas: (baseLen, expLen, modLen, expHead) => Effect.sync(() => ModExp.calculateGas(baseLen, expLen, modLen, expHead))
})

/**
 * Test layer for ModExpService returning deterministic results.
 *
 * @description
 * Provides mock implementations for unit testing. Returns 0n for modexp,
 * zero-filled arrays for modexpBytes, and 200n for gas calculations.
 * Use when testing application logic without computation overhead.
 *
 * @example
 * ```typescript
 * import { ModExpService, ModExpTest, modexp } from 'voltaire-effect/crypto/ModExp'
 * import * as Effect from 'effect/Effect'
 *
 * const testProgram = modexp(2n, 10n, 1000n).pipe(Effect.provide(ModExpTest))
 * // Always returns 0n
 * ```
 *
 * @since 0.0.1
 */
export const ModExpTest = Layer.succeed(ModExpService, {
  modexp: (_base, _exp, _modulus) => Effect.sync(() => 0n),
  modexpBytes: (_baseBytes, _expBytes, modBytes) => Effect.sync(() => new Uint8Array(modBytes.length)),
  calculateGas: (_baseLen, _expLen, _modLen, _expHead) => Effect.sync(() => 200n)
})
