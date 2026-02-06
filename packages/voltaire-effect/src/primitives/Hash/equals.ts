/**
 * @fileoverview Constant-time hash equality comparison.
 *
 * @module Hash/equals
 * @since 0.0.1
 */

import type { HashType } from "@tevm/voltaire/Hash";
import * as Hash from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";

/**
 * Compare two hashes for equality using constant-time comparison.
 *
 * @description Uses constant-time comparison to prevent timing attacks.
 * This is a pure synchronous function that never fails.
 *
 * @param {HashType} hash - First hash
 * @param {HashType} other - Hash to compare with
 * @returns {Effect.Effect<boolean>} Effect containing true if hashes are equal
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const areEqual = Effect.runSync(Hash.equals(hash1, hash2))
 * ```
 *
 * @since 0.0.1
 */
export const equals = (
	hash: HashType,
	other: HashType,
): Effect.Effect<boolean> => Effect.sync(() => Hash.equals(hash, other));
