// @ts-nocheck
import * as Hex from "../Hex/index.js";

/**
 * @typedef {import('./StorageValueType.js').StorageValueType} StorageValueType
 */

/**
 * Creates a StorageValue from a hex string.
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {StorageValueType} - A branded StorageValue
 *
 * @example
 * ```typescript
 * const val = StorageValue.fromHex("0x1234...");
 * ```
 */
export function fromHex(hex) {
	const bytes = Hex.toBytes(hex);

	if (bytes.length !== 32) {
		throw new Error(
			`StorageValue must be exactly 32 bytes, got ${bytes.length}`,
		);
	}

	Object.defineProperty(bytes, Symbol.for("voltaire.brand"), {
		value: "StorageValue",
		enumerable: false,
		writable: false,
		configurable: false,
	});

	return /** @type {StorageValueType} */ (bytes);
}
