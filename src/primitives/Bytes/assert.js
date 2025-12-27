import { isBytes } from "./isBytes.js";

/**
 * Assert that value is valid Bytes, throw if not
 *
 * @param {unknown} value - Value to check
 * @returns {import('./BytesType.js').BytesType} The validated bytes
 * @throws {Error} If value is not valid Bytes
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * const bytes = Bytes.assert(new Uint8Array([1, 2, 3])); // returns bytes
 * Bytes.assert("not bytes"); // throws Error
 * ```
 */
export function assert(value) {
	if (!isBytes(value)) {
		throw new Error(
			`Expected Uint8Array but got ${typeof value === "object" ? (value === null ? "null" : value.constructor?.name || "object") : typeof value}`,
		);
	}
	return value;
}
