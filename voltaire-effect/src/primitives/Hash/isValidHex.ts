/**
 * @fileoverview Validate hex string is valid hash format.
 *
 * @module Hash/isValidHex
 * @since 0.0.1
 */
import * as Hash from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";

/**
 * Validate hex string is valid hash format.
 *
 * @description Checks if the string is a valid 32-byte hex representation.
 * This is a pure synchronous function that never fails.
 *
 * @param {string} hex - Hex string to validate
 * @returns {Effect.Effect<boolean>} Effect containing true if valid hash hex format
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const isValid = Effect.runSync(Hash.isValidHex('0x' + 'ab'.repeat(32)))
 * ```
 *
 * @since 0.0.1
 */
export const isValidHex = (hex: string): Effect.Effect<boolean> =>
	Effect.sync(() => Hash.isValidHex(hex));
