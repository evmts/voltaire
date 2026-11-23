import { HARDENED_OFFSET } from "./constants.js";
import { InvalidPathError } from "./errors.js";

const INDEX_PATTERN = /^(\d+)(['hH])?$/;
const MAX_BASE_INDEX = HARDENED_OFFSET - 1;

/**
 * Parse BIP-32 index string with hardened notation.
 *
 * The whole token must be a decimal integer in [0, 2^31 - 1], optionally
 * followed by one hardened marker (`'`, `h`, or `H`), which adds
 * HARDENED_OFFSET. Signs, whitespace, decimals, hex, and trailing characters
 * are rejected.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} indexStr - Index string (e.g., "0", "0'", "0h", "0H")
 * @returns {number} Numeric index (hardened indices have HARDENED_OFFSET added)
 * @throws {InvalidPathError} If the token is not a decimal integer in [0, 2^31 - 1] with an optional hardened suffix
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * HDWallet.parseIndex("0");   // 0
 * HDWallet.parseIndex("0'");  // 2147483648 (0x80000000)
 * HDWallet.parseIndex("44h"); // 2147483692 (44 + 0x80000000)
 * ```
 */
export function parseIndex(indexStr) {
	const match =
		typeof indexStr === "string" ? INDEX_PATTERN.exec(indexStr) : null;
	const index = match ? Number(match[1]) : Number.NaN;

	if (!match || !(index <= MAX_BASE_INDEX)) {
		throw new InvalidPathError(`Invalid index: ${indexStr}`, {
			code: -32602,
			context: { indexStr, parsed: index },
			docsPath: "/crypto/hdwallet/parse-index#error-handling",
		});
	}

	return match[2] ? index + HARDENED_OFFSET : index;
}
