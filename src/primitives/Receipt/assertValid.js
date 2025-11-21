/**
 * Validate receipt structure (Byzantium vs pre-Byzantium)
 *
 * @param {import('./ReceiptType.js').ReceiptType} receipt - Receipt to validate
 * @throws {TypeError} If receipt has both status and root, or neither
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
export function assertValid(receipt) {
	const hasStatus = "status" in receipt && receipt.status !== undefined;
	const hasRoot = "root" in receipt && receipt.root !== undefined;

	if (hasStatus && hasRoot) {
		throw new TypeError(
			"Receipt cannot have both status and root (Byzantium fork incompatibility)",
		);
	}

	if (!hasStatus && !hasRoot) {
		throw new TypeError(
			"Receipt must have either status (post-Byzantium) or root (pre-Byzantium)",
		);
	}
}
