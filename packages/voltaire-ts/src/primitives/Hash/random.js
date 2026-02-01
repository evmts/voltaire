import { ValidationError } from "../errors/index.js";
import { SIZE } from "./HashType.js";

/**
 * Generate random hash
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @returns {import('./HashType.js').HashType} Random 32-byte hash
 * @throws {ValidationError} If crypto.getRandomValues not available
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.random();
 * ```
 */
export function random() {
	if (typeof crypto !== "undefined" && crypto.getRandomValues) {
		const bytes = new Uint8Array(SIZE);
		crypto.getRandomValues(bytes);
		return /** @type {import('./HashType.js').HashType} */ (bytes);
	}
	throw new ValidationError("crypto.getRandomValues not available", {
		code: -32000,
		value: typeof crypto,
		expected: "Web Crypto API",
		docsPath: "/primitives/hash",
	});
}
