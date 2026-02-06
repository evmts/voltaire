/**
 * @fileoverview Create Hash from raw bytes.
 *
 * @module Hash/fromBytes
 * @since 0.0.1
 */

import type { HashType } from "@tevm/voltaire/Hash";
import * as Hash from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";
import { ValidationError } from "@tevm/voltaire/errors";

/**
 * Create Hash from raw bytes.
 *
 * @description Creates a hash from a 32-byte Uint8Array.
 * Can fail if input is wrong length.
 *
 * @param {Uint8Array} bytes - Raw bytes (must be 32 bytes)
 * @returns {Effect.Effect<HashType, ValidationError>} Effect containing the hash
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const hash = Effect.runSync(Hash.fromBytes(new Uint8Array(32)))
 * ```
 *
 * @since 0.0.1
 */
export const fromBytes = (
	bytes: Uint8Array,
): Effect.Effect<HashType, ValidationError> =>
	Effect.try({
		try: () => Hash.fromBytes(bytes),
		catch: (error) =>
			new ValidationError(
				error instanceof Error ? error.message : "Invalid bytes input",
				{
					value: bytes,
					expected: "32-byte Uint8Array",
					cause: error instanceof Error ? error : undefined,
				},
			),
	});
