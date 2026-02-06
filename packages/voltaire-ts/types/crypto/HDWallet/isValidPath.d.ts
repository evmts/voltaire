/**
 * Validate BIP-32 derivation path format.
 *
 * Validates:
 * - Path starts with 'm/' or 'M/' (case-insensitive)
 * - Each component is a valid non-negative integer
 * - Normal indices are < 2^31 (hardened indices are unlimited up to 2^31-1 + offset)
 * - Hardened notation uses ' (apostrophe) only (@scure/bip32 doesn't support 'h')
 * - Path depth doesn't exceed 255 levels
 * - No double slashes, trailing slashes, or invalid characters
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} path - Derivation path to validate
 * @returns {boolean} True if path is valid BIP-32 format, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * HDWallet.isValidPath("m/44'/60'/0'/0/0"); // true
 * HDWallet.isValidPath("m/44h/60'/0'/0/0"); // false ('h' notation not supported)
 * HDWallet.isValidPath("invalid");          // false
 * ```
 */
export function isValidPath(path: string): boolean;
//# sourceMappingURL=isValidPath.d.ts.map