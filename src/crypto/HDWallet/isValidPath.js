/**
 * Maximum valid child index for BIP-32 derivation (2^31 - 1).
 * Indices 0 to MAX_CHILD_INDEX are valid for both normal and hardened derivation.
 * @type {number}
 */
const MAX_CHILD_INDEX = 0x7fffffff;

/**
 * Validate BIP-32 derivation path format.
 *
 * Validates:
 * - Path starts with "m/" or "M/"
 * - Components are valid non-negative integers
 * - Hardened notation ("'" or "h") is correct
 * - Indices don't exceed 2^31 - 1
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} path - Derivation path to validate
 * @returns {boolean} True if path matches BIP-32 format (m/number'/number/...), false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * HDWallet.isValidPath("m/44'/60'/0'/0/0"); // true
 * HDWallet.isValidPath("m/44h/60h/0h/0/0"); // true (h notation)
 * HDWallet.isValidPath("invalid");          // false
 * HDWallet.isValidPath("m/2147483648'/0");  // false (index exceeds max)
 * ```
 */
export function isValidPath(path) {
	// Must start with m/ or M/
	if (!/^[mM]\//.test(path)) {
		return false;
	}

	// Remove leading m/ or M/
	const normalized = path.replace(/^[mM]\//, "");

	// Must have at least one component after m/
	if (normalized === "") {
		return false;
	}

	const parts = normalized.split("/");

	for (const part of parts) {
		// Empty parts (double slashes, trailing slash)
		if (part === "") {
			return false;
		}

		// Check for hardened notation (' or h)
		const isHardened = part.endsWith("'") || part.endsWith("h");
		const indexStr = isHardened ? part.slice(0, -1) : part;

		// Must be a valid non-negative integer (no leading zeros except "0" itself)
		if (!/^\d+$/.test(indexStr)) {
			return false;
		}

		// Check for leading zeros (invalid except for "0")
		if (indexStr.length > 1 && indexStr.startsWith("0")) {
			return false;
		}

		const index = Number.parseInt(indexStr, 10);

		// Must be a valid integer and not exceed max
		if (Number.isNaN(index) || index < 0 || index > MAX_CHILD_INDEX) {
			return false;
		}
	}

	return true;
}
