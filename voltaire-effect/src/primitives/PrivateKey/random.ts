/**
 * @fileoverview Effect-based random private key generation.
 * @module random
 * @since 0.0.1
 */

import { PrivateKey, type PrivateKeyType } from "@tevm/voltaire/PrivateKey";
import * as Effect from "effect/Effect";

/**
 * Generates a cryptographically random private key.
 *
 * @returns Effect yielding a random 32-byte private key
 *
 * @example
 * ```typescript
 * const pk = Effect.runSync(PrivateKey.random())
 * ```
 *
 * @since 0.0.1
 */
export const random = (): Effect.Effect<PrivateKeyType> =>
	Effect.sync(() => {
		const bytes = new Uint8Array(32);
		crypto.getRandomValues(bytes);
		return PrivateKey.fromBytes(bytes);
	});
