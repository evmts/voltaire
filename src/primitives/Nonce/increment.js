import * as Uint from "../Uint/index.js";

/**
 * Increment nonce by 1
 *
 * @this {import('./NonceType.js').NonceType}
 * @returns {import('./NonceType.js').NonceType} New nonce incremented by 1
 *
 * @example
 * ```typescript
 * const next = Nonce._increment.call(nonce);
 * ```
 */
export function increment() {
	const current = Uint.toBigInt(
		/** @type {import('../Uint/index.js').Type} */ (
			/** @type {unknown} */ (this)
		),
	);
	return /** @type {import('./NonceType.js').NonceType} */ (
		/** @type {unknown} */ (Uint.from(current + 1n))
	);
}
