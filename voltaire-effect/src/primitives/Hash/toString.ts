/**
 * @fileoverview Convert hash to string representation.
 *
 * @module Hash/toString
 * @since 0.0.1
 */

import type { HashType } from "@tevm/voltaire/Hash";
import * as Hash from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";

/**
 * Convert hash to string representation.
 *
 * @description Returns the hex string representation of the hash.
 * This is a pure synchronous function that never fails.
 *
 * @param {HashType} hash - Hash to convert
 * @returns {Effect.Effect<string>} Effect containing the string representation
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const str = Effect.runSync(Hash.toString(hash))
 * ```
 *
 * @since 0.0.1
 */
export const toString = (hash: HashType): Effect.Effect<string> =>
	Effect.sync(() => Hash.toString(hash));
