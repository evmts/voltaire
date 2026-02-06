/**
 * @fileoverview Effect-based private key validation.
 * @module isValid
 * @since 0.0.1
 */

import { PrivateKey } from "@tevm/voltaire/PrivateKey";
import * as Effect from "effect/Effect";

/**
 * Checks if a value is a valid private key.
 *
 * @param value - Value to validate (hex string or Uint8Array)
 * @returns Effect yielding boolean
 *
 * @example
 * ```typescript
 * const valid = Effect.runSync(PrivateKey.isValid('0x...'))
 * ```
 *
 * @since 0.0.1
 */
export const isValid = (value: string | Uint8Array): Effect.Effect<boolean> =>
	Effect.sync(() => {
		try {
			if (typeof value === "string") {
				PrivateKey.from(value);
			} else {
				PrivateKey.fromBytes(value);
			}
			return true;
		} catch {
			return false;
		}
	});
