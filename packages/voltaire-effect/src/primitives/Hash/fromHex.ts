/**
 * @fileoverview Create Hash from hex string.
 *
 * @module Hash/fromHex
 * @since 0.0.1
 */

import type { HashType } from "@tevm/voltaire/Hash";
import * as Hash from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";
import { ValidationError } from "@tevm/voltaire/errors";

/**
 * Create Hash from hex string.
 *
 * @description Parses a 66-character hex string (with 0x prefix) into a 32-byte hash.
 * Can fail if input is invalid format or wrong length.
 *
 * @param {string} hex - Hex string with optional 0x prefix
 * @returns {Effect.Effect<HashType, ValidationError>} Effect containing the hash
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const hash = Effect.runSync(Hash.fromHex('0x' + 'ab'.repeat(32)))
 * ```
 *
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<HashType, ValidationError> =>
	Effect.try({
		try: () => Hash.fromHex(hex),
		catch: (error) =>
			new ValidationError(
				error instanceof Error ? error.message : "Invalid hex string",
				{
					value: hex,
					expected: "66-character hex string (0x + 64 hex chars)",
					cause: error instanceof Error ? error : undefined,
				},
			),
	});
