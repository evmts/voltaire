import { HARDENED_OFFSET } from "./constants.js";
import { InvalidPathError } from "./errors.js";

/**
 * Maximum valid child index for BIP-32 derivation (2^31 - 1).
 * @type {number}
 */
const MAX_CHILD_INDEX = 0x7fffffff;

/**
 * Parse BIP-32 index string with hardened notation.
 *
 * Converts "0'" or "0h" to hardened index (adds HARDENED_OFFSET).
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} indexStr - Index string (e.g., "0", "0'", "0h")
 * @returns {number} Numeric index (hardened indices have HARDENED_OFFSET added)
 * @throws {InvalidPathError} If index format is invalid, not a non-negative integer, or exceeds 2^31-1
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * HDWallet.parseIndex("0");   // 0
 * HDWallet.parseIndex("0'");  // 2147483648 (0x80000000)
 * HDWallet.parseIndex("44h"); // 2147483692 (44 + 0x80000000)
 * ```
 */
export function parseIndex(indexStr) {
	const hardened = indexStr.endsWith("'") || indexStr.endsWith("h");
	const numericStr = indexStr.replace(/['h]$/, "");

	// Check for valid numeric format (digits only, no leading zeros except "0")
	if (!/^\d+$/.test(numericStr)) {
		throw new InvalidPathError(`Invalid index: ${indexStr}`, {
			code: "INVALID_INDEX",
			context: { indexStr, reason: "not a valid integer" },
			docsPath: "/crypto/hdwallet/parse-index#error-handling",
		});
	}

	const index = Number.parseInt(numericStr, 10);

	if (Number.isNaN(index) || index < 0) {
		throw new InvalidPathError(`Invalid index: ${indexStr}`, {
			code: "INVALID_INDEX",
			context: { indexStr, parsed: index },
			docsPath: "/crypto/hdwallet/parse-index#error-handling",
		});
	}

	if (index > MAX_CHILD_INDEX) {
		throw new InvalidPathError(
			`Index exceeds maximum (2^31-1): ${indexStr}`,
			{
				code: "INDEX_OUT_OF_RANGE",
				context: { indexStr, index, max: MAX_CHILD_INDEX },
				docsPath: "/crypto/hdwallet/parse-index#error-handling",
			},
		);
	}

	return hardened ? index + HARDENED_OFFSET : index;
}
