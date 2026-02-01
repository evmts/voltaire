/**
 * @fileoverview Keccak256 hash functions.
 *
 * @module Hash/keccak256
 * @since 0.0.1
 */

import type { HashType } from "@tevm/voltaire/Hash";
import * as Hash from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";

/**
 * Compute keccak256 hash of bytes.
 *
 * @description Computes the keccak256 hash of the input bytes.
 * This is a pure synchronous function that never fails.
 *
 * @param {Uint8Array} data - Data to hash
 * @returns {Effect.Effect<HashType>} Effect containing the hash
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const hash = Effect.runSync(Hash.keccak256(new Uint8Array([1, 2, 3])))
 * ```
 *
 * @since 0.0.1
 */
export const keccak256 = (data: Uint8Array): Effect.Effect<HashType> =>
	Effect.sync(() => Hash.keccak256(data));

/**
 * Compute keccak256 hash of hex string.
 *
 * @param {string} hex - Hex string to hash
 * @returns {Effect.Effect<HashType>} Effect containing the hash
 *
 * @since 0.0.1
 */
export const keccak256Hex = (hex: string): Effect.Effect<HashType> =>
	Effect.sync(() => Hash.keccak256Hex(hex));

/**
 * Compute keccak256 hash of UTF-8 string.
 *
 * @param {string} str - String to hash
 * @returns {Effect.Effect<HashType>} Effect containing the hash
 *
 * @since 0.0.1
 */
export const keccak256String = (str: string): Effect.Effect<HashType> =>
	Effect.sync(() => Hash.keccak256String(str));
