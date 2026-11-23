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
export function parseIndex(indexStr: string): number;
//# sourceMappingURL=parseIndex.d.ts.map