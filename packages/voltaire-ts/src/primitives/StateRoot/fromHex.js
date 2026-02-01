import { Hash } from "../Hash/index.js";

/**
 * @typedef {import('./StateRootType.js').StateRootType} StateRootType
 */

/**
 * Creates a StateRoot from a hex string.
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {StateRootType} - A branded StateRoot
 *
 * @example
 * ```typescript
 * const root = StateRoot.fromHex("0x1234...");
 * ```
 */
export function fromHex(hex) {
	const hash = Hash.fromHex(hex);

	// Brand as StateRoot
	Object.defineProperty(hash, Symbol.for("voltaire.brand"), {
		value: "StateRoot",
		enumerable: false,
		writable: false,
		configurable: false,
	});

	return /** @type {StateRootType} */ (/** @type {unknown} */ (hash));
}
