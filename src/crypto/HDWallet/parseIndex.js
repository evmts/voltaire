import { HARDENED_OFFSET } from "./constants.js";
import { InvalidPathError } from "./errors.js";

/**
 * Parse hardened index notation
 *
 * @param {string} indexStr - Index string (e.g., "0" or "0'" or "0h")
 * @returns {number} Numeric index
 * @throws {InvalidPathError} If index format is invalid
 *
 * @example
 * ```typescript
 * HDWallet.parseIndex("0");   // 0
 * HDWallet.parseIndex("0'");  // 2147483648 (0x80000000)
 * HDWallet.parseIndex("0h");  // 2147483648 (0x80000000)
 * ```
 */
export function parseIndex(indexStr) {
	const hardened = indexStr.endsWith("'") || indexStr.endsWith("h");
	const index = Number.parseInt(indexStr.replace(/['h]$/, ""), 10);

	if (Number.isNaN(index) || index < 0) {
		throw new InvalidPathError(`Invalid index: ${indexStr}`);
	}

	return hardened ? index + HARDENED_OFFSET : index;
}
