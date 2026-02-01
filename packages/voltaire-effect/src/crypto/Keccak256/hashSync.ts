/**
 * @fileoverview Synchronous Keccak-256 hash function without Effect service layer.
 *
 * @description
 * Provides a direct synchronous Keccak-256 hash function that bypasses the Effect
 * service layer. Use this when you need a simple hash without Effect dependency
 * injection overhead.
 *
 * @module Keccak256/hashSync
 * @since 0.2.25
 */

import type { Keccak256Hash } from "@tevm/voltaire";
import { Keccak256 } from "@tevm/voltaire";

/**
 * Computes the Keccak-256 hash of the provided data synchronously.
 *
 * @description
 * This is a direct synchronous version of the Keccak-256 hash that does not
 * require the Effect service layer. Use this when you need a simple hash
 * operation without Effect dependency injection.
 *
 * For Effect-based applications that need testability and dependency injection,
 * use {@link hash} with {@link KeccakService} instead.
 *
 * @param {Uint8Array} data - The input bytes to hash. Can be any length.
 * @returns {Keccak256Hash} A 32-byte Keccak256Hash (branded Uint8Array)
 *
 * @example Basic usage
 * ```typescript
 * import { hashSync } from 'voltaire-effect/crypto/Keccak256'
 *
 * const data = new Uint8Array([1, 2, 3])
 * const result = hashSync(data)
 * console.log(result) // Uint8Array(32) [...]
 * ```
 *
 * @example Hashing a string
 * ```typescript
 * import { hashSync } from 'voltaire-effect/crypto/Keccak256'
 *
 * const message = new TextEncoder().encode('hello world')
 * const hash = hashSync(message)
 * ```
 *
 * @see {@link hash} - Effect-based version with dependency injection
 * @see {@link KeccakService} - Service interface for Effect-based usage
 * @since 0.2.25
 */
export const hashSync = (data: Uint8Array): Keccak256Hash => {
	return Keccak256.hash(data);
};
