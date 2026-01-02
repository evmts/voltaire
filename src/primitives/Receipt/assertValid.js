import { InvalidReceiptError } from "./errors.js";

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
export function assertValid(receipt) {
	const hasStatus = "status" in receipt && receipt.status !== undefined;
	const hasRoot = "root" in receipt && receipt.root !== undefined;

	if (hasStatus && hasRoot) {
		throw new InvalidReceiptError(
			"Receipt cannot have both status and root (Byzantium fork incompatibility)",
			{ expected: "either status (post-Byzantium) or root (pre-Byzantium), not both" },
		);
	}

	if (!hasStatus && !hasRoot) {
		throw new InvalidReceiptError(
			"Receipt must have either status (post-Byzantium) or root (pre-Byzantium)",
			{ expected: "status or root field" },
		);
	}
}
