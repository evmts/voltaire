/**
 * Check if value is a valid address (accepts string, Uint8Array, or Address instance)
 *
 * @param {string | Uint8Array} value - Value to validate
 * @returns {boolean} True if valid address format
 *
 * @example
 * ```typescript
 * // Validate hex string
 * Address.isValid("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"); // true
 *
 * // Validate Uint8Array (including Address instances)
 * const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * Address.isValid(addr); // true
 *
 * // Invalid cases
 * Address.isValid("0xinvalid"); // false
 * Address.isValid(new Uint8Array(10)); // false (wrong length)
 * ```
 */
export function isValid(value) {
    // Handle Uint8Array (including Address instances)
    if (value instanceof Uint8Array) {
        return value.length === 20;
    }
    // Handle string
    if (typeof value === "string") {
        // Normalize to 0x format
        const normalized = value.startsWith("0x") ? value : `0x${value}`;
        // Must be 0x + 40 hex chars = 42 chars total
        if (normalized.length !== 42)
            return false;
        // Check all characters are valid hex
        for (let i = 2; i < normalized.length; i++) {
            const c = normalized.charCodeAt(i);
            const isHex = (c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102);
            if (!isHex)
                return false;
        }
        return true;
    }
    return false;
}
