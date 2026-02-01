/**
 * Maximum index value for non-hardened derivation (2^31 - 1).
 * @type {number}
 */
const MAX_NORMAL_INDEX = 0x7fffffff;
/**
 * Maximum derivation depth allowed by BIP-32.
 * @type {number}
 */
const MAX_DEPTH = 255;
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
export function isValidPath(path) {
    // Must start with m/ or M/
    if (!/^[mM]\//.test(path)) {
        return false;
    }
    // Remove prefix and split
    const normalized = path.slice(2);
    // No trailing slash or double slashes
    if (normalized.endsWith("/") || normalized.includes("//")) {
        return false;
    }
    // Empty path after m/ is invalid
    if (normalized === "") {
        return false;
    }
    const components = normalized.split("/");
    // Check depth limit
    if (components.length > MAX_DEPTH) {
        return false;
    }
    // Validate each component
    for (const component of components) {
        // Must match: digits followed by optional apostrophe
        // Note: 'h' notation is NOT supported by @scure/bip32
        if (!/^\d+'?$/.test(component)) {
            return false;
        }
        const isHardened = component.endsWith("'");
        const indexStr = isHardened ? component.slice(0, -1) : component;
        const index = Number.parseInt(indexStr, 10);
        // Check for NaN (shouldn't happen with regex, but be safe)
        if (Number.isNaN(index)) {
            return false;
        }
        // Non-hardened indices must be < 2^31
        // Hardened indices must also be < 2^31 (before adding offset)
        if (index > MAX_NORMAL_INDEX) {
            return false;
        }
    }
    return true;
}
