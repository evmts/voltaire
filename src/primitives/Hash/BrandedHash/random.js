import { ValidationError } from "../../errors/ValidationError.js";
import { SIZE } from "./BrandedHash.js";

/**
 * Generate random hash
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @returns {import('./BrandedHash.js').BrandedHash} Random 32-byte hash
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
		return /** @type {import('./BrandedHash.ts').BrandedHash} */ (bytes);
	}
	throw new ValidationError("crypto.getRandomValues not available", {
		code: "HASH_CRYPTO_UNAVAILABLE",
		value: typeof crypto,
		expected: "Web Crypto API",
		docsPath: "/primitives/hash",
	});
}
