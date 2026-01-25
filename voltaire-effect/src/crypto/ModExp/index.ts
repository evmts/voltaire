/**
 * Modular exponentiation module for Effect.
 * Computes base^exp mod modulus for arbitrary-precision integers.
 * Used by MODEXP precompile (0x05) per EIP-198/EIP-2565.
 * @module
 * @since 0.0.1
 */
export { ModExpService, ModExpLive, ModExpTest, type ModExpServiceShape } from './ModExpService.js'
export { modexp, modexpBytes, calculateGas } from './operations.js'
