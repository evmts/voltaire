import * as Effect from 'effect/Effect'
import { ModExpService } from './ModExpService.js'

/**
 * Computes base^exp mod modulus for arbitrary-precision integers.
 *
 * @param base - Base value
 * @param exp - Exponent value
 * @param modulus - Modulus value (must be > 0)
 * @returns Effect containing the result, requiring ModExpService
 * @example
 * ```typescript
 * import { modexp, ModExpLive } from 'voltaire-effect/crypto/ModExp'
 * import * as Effect from 'effect/Effect'
 *
 * const program = modexp(2n, 10n, 1000n).pipe(
 *   Effect.provide(ModExpLive)
 * )
 * ```
 * @since 0.0.1
 */
export const modexp = (base: bigint, exp: bigint, modulus: bigint): Effect.Effect<bigint, never, ModExpService> =>
  Effect.gen(function* () {
    const service = yield* ModExpService
    return yield* service.modexp(base, exp, modulus)
  })

/**
 * Computes base^exp mod modulus with byte array inputs/outputs.
 * Output is padded to modulus length per EIP-198 spec.
 *
 * @param baseBytes - Base as big-endian bytes
 * @param expBytes - Exponent as big-endian bytes
 * @param modBytes - Modulus as big-endian bytes
 * @returns Effect containing the result as big-endian bytes, requiring ModExpService
 * @example
 * ```typescript
 * import { modexpBytes, ModExpLive } from 'voltaire-effect/crypto/ModExp'
 * import * as Effect from 'effect/Effect'
 *
 * const program = modexpBytes(
 *   new Uint8Array([0x02]),
 *   new Uint8Array([0x0a]),
 *   new Uint8Array([0x03, 0xe8])
 * ).pipe(Effect.provide(ModExpLive))
 * ```
 * @since 0.0.1
 */
export const modexpBytes = (baseBytes: Uint8Array, expBytes: Uint8Array, modBytes: Uint8Array): Effect.Effect<Uint8Array, never, ModExpService> =>
  Effect.gen(function* () {
    const service = yield* ModExpService
    return yield* service.modexpBytes(baseBytes, expBytes, modBytes)
  })

/**
 * Calculate gas cost for MODEXP operation per EIP-2565.
 *
 * @param baseLen - Length of base in bytes
 * @param expLen - Length of exponent in bytes
 * @param modLen - Length of modulus in bytes
 * @param expHead - First 32 bytes of exponent as BigInt
 * @returns Effect containing gas cost, requiring ModExpService
 * @example
 * ```typescript
 * import { calculateGas, ModExpLive } from 'voltaire-effect/crypto/ModExp'
 * import * as Effect from 'effect/Effect'
 *
 * const program = calculateGas(1n, 1n, 2n, 10n).pipe(
 *   Effect.provide(ModExpLive)
 * )
 * ```
 * @since 0.0.1
 */
export const calculateGas = (baseLen: bigint, expLen: bigint, modLen: bigint, expHead: bigint): Effect.Effect<bigint, never, ModExpService> =>
  Effect.gen(function* () {
    const service = yield* ModExpService
    return yield* service.calculateGas(baseLen, expLen, modLen, expHead)
  })
