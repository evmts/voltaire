/**
 * Check if receipt is pre-Byzantium (uses state root instead of status)
 *
 * @param {import('./ReceiptType.js').ReceiptType} receipt - Receipt to check
 * @returns {boolean} True if receipt is pre-Byzantium
 *
 * @example
 * ```javascript
 * import { isPreByzantium } from './primitives/Receipt/isPreByzantium.js';
 *
 * // Pre-Byzantium receipt (has root)
 * isPreByzantium({ ...receipt, root: stateRoot }); // true
 *
 * // Post-Byzantium receipt (has status)
 * isPreByzantium({ ...receipt, status: 1 }); // false
 * ```
 */
export function isPreByzantium(receipt) {
    return "root" in receipt && receipt.root !== undefined;
}
