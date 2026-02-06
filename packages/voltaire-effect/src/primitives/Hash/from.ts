/**
 * @fileoverview Create Hash from string or bytes.
 *
 * @module Hash/from
 * @since 0.0.1
 */

import type { HashType } from "@tevm/voltaire/Hash";
import * as Hash from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";
import { ValidationError } from "@tevm/voltaire/errors";

/**
 * Create Hash from string or bytes.
 *
 * @description Parses hex string or Uint8Array into a 32-byte hash.
 * Can fail if input is invalid format or wrong length.
 *
 * @param {string | Uint8Array} value - Hex string or Uint8Array
 * @returns {Effect.Effect<HashType, ValidationError>} Effect containing the hash
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const hash = Effect.runSync(Hash.from('0x' + 'ab'.repeat(32)))
 * const hash2 = Effect.runSync(Hash.from(new Uint8Array(32)))
 * ```
 *
 * @since 0.0.1
 */
export const from = (
	value: string | Uint8Array,
): Effect.Effect<HashType, ValidationError> =>
	Effect.try({
		try: () => Hash.from(value),
		catch: (error) =>
			new ValidationError(
				error instanceof Error ? error.message : "Invalid hash input",
				{
					value,
					expected: "32-byte hash",
					cause: error instanceof Error ? error : undefined,
				},
			),
	});
