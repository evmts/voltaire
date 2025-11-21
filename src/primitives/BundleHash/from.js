import { SIZE } from "./BundleHashType.js";
// @ts-nocheck
import { InvalidBundleHashError } from "./errors.js";

/**
 * @typedef {import('./BundleHashType.js').BundleHashType} BundleHashType
 * @typedef {import('./BundleHashType.js').BundleHashLike} BundleHashLike
 */

/**
 * Creates a BundleHash from various input types
 *
 * @param {BundleHashLike} value - BundleHash input (hex string or bytes)
 * @returns {BundleHashType} BundleHash instance
 * @throws {InvalidBundleHashError} If input format is invalid
 * @example
 * ```typescript
 * import * as BundleHash from './BundleHash/index.js';
 * const hash = BundleHash.from("0x1234...");
 * ```
 */
export function from(value) {
	if (value instanceof Uint8Array) {
		if (value.length !== SIZE) {
			throw new InvalidBundleHashError(
				`BundleHash must be ${SIZE} bytes, got ${value.length}`,
				{ value },
			);
		}
		return value;
	}

	if (typeof value === "string") {
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
		return bytes;
	}

	throw new InvalidBundleHashError(
		"BundleHash must be hex string or Uint8Array",
		{ value },
	);
}
