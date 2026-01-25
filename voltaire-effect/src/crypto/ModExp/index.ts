/**
 * @fileoverview Modular exponentiation module for Effect.
 * Computes base^exp mod modulus for arbitrary-precision integers.
 *
 * @module ModExp
 * @since 0.0.1
 *
 * @description
 * Modular exponentiation computes (base^exponent) mod modulus efficiently.
 * This operation is fundamental to RSA, Diffie-Hellman, and other cryptographic
 * algorithms. Implemented per EIP-198/EIP-2565 for EVM compatibility.
 *
 * Key features:
 * - Arbitrary-precision integers (BigInt)
 * - Byte array interface for EVM compatibility
 * - Gas calculation per EIP-2565 pricing formula
 *
 * @example
 * ```typescript
 * import { ModExpService, ModExpLive, modexp, modexpBytes, calculateGas } from 'voltaire-effect/crypto/ModExp'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   // Compute 2^10 mod 1000 = 24
 *   const result = yield* modexp(2n, 10n, 1000n)
 *   return result // 24n
 * }).pipe(Effect.provide(ModExpLive))
 * ```
 *
 * @see {@link https://eips.ethereum.org/EIPS/eip-198 | EIP-198}
 * @see {@link https://eips.ethereum.org/EIPS/eip-2565 | EIP-2565}
 */
export { ModExpService, ModExpLive, ModExpTest, type ModExpServiceShape } from './ModExpService.js'
export { modexp, modexpBytes, calculateGas } from './operations.js'
