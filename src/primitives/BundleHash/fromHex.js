import { SIZE } from "./BundleHashType.js";
import { InvalidBundleHashError } from "./errors.js";

/**
 * @typedef {import('./BundleHashType.js').BundleHashType} BundleHashType
 */

/**
 * Creates BundleHash from hex string
 *
 * @param {string} value - Hex string (with or without 0x prefix)
 * @returns {BundleHashType} BundleHash instance
 * @throws {InvalidBundleHashError} If hex format is invalid
 * @example
 * ```typescript
 * import * as BundleHash from './BundleHash/index.js';
 * const hash = BundleHash.fromHex("0x1234...");
 * ```
 */
export function fromHex(value) {
	if (typeof value !== "string") {
		throw new InvalidBundleHashError("Value must be a string", { value });
	}

	const hex = value.startsWith("0x") ? value.slice(2) : value;
	if (hex.length !== SIZE * 2) {
		throw new InvalidBundleHashError(
			`BundleHash hex string must be ${SIZE * 2} characters, got ${hex.length}`,
			{ value },
		);
	}

	const bytes = new Uint8Array(SIZE);
	for (let i = 0; i < hex.length; i += 2) {
		const byte = Number.parseInt(hex.slice(i, i + 2), 16);
		if (Number.isNaN(byte)) {
			throw new InvalidBundleHashError("Invalid hex character", { value });
		}
		bytes[i / 2] = byte;
	}

	return /** @type {BundleHashType} */ (/** @type {unknown} */ (bytes));
}
