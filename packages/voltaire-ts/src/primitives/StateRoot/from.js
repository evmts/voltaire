import { Hash } from "../Hash/index.js";

/**
 * @typedef {import('./StateRootType.js').StateRootType} StateRootType
 * @typedef {import('./StateRootType.js').StateRootLike} StateRootLike
 */

/**
 * Creates a StateRoot from various input types.
 * Accepts hex strings, Uint8Array, or existing StateRoot instances.
 *
 * @param {StateRootLike} value - The value to convert
 * @returns {StateRootType} - A branded StateRoot
 *
 * @example
 * ```typescript
 * const root = StateRoot.from("0x1234...");
 * const root2 = StateRoot.from(new Uint8Array(32));
 * ```
 */
export function from(value) {
	// If already a StateRoot, return as-is
	if (
		value &&
		/** @type {any} */ (value)[Symbol.for("voltaire.brand")] === "StateRoot"
	) {
		return /** @type {StateRootType} */ (value);
	}

	// Convert to Hash first (validates 32 bytes)
	const hash = Hash(/** @type {string | Uint8Array} */ (value));

	// Brand as StateRoot
	Object.defineProperty(hash, Symbol.for("voltaire.brand"), {
		value: "StateRoot",
		enumerable: false,
		writable: false,
		configurable: false,
	});

	return /** @type {StateRootType} */ (/** @type {unknown} */ (hash));
}
