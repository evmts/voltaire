/**
 * Validate receipt structure (Byzantium vs pre-Byzantium)
 *
 * @see https://voltaire.tevm.sh/primitives/receipt for Receipt documentation
 * @since 0.0.0
 * @param {import('./ReceiptType.js').ReceiptType} receipt - Receipt to validate
 * @throws {InvalidReceiptError} If receipt has both status and root, or neither
 *
 * @example
 * ```javascript
 * import { assertValid } from './primitives/Receipt/assertValid.js';
 *
 * // Post-Byzantium (has status)
 * assertValid({ ...receipt, status: 1 });
 *
 * // Pre-Byzantium (has root)
 * assertValid({ ...receipt, root: stateRoot });
 * ```
 */
export function assertValid(receipt: import("./ReceiptType.js").ReceiptType): void;
//# sourceMappingURL=assertValid.d.ts.map