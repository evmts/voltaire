import { InvalidBundleError } from "./errors.js";

/**
 * @typedef {import('./BundleType.js').BundleType} BundleType
 */

/**
 * Adds a transaction to the bundle
 *
 * @param {BundleType} bundle - Bundle instance
 * @param {Uint8Array | string} transaction - Signed transaction to add
 * @returns {BundleType} New bundle with added transaction
 * @throws {InvalidBundleError} If transaction format is invalid
 * @example
 * ```typescript
 * import * as Bundle from './Bundle/index.js';
 * const newBundle = Bundle.addTransaction(bundle, signedTx);
 * ```
 */
export function addTransaction(bundle, transaction) {
	let txBytes;
	if (transaction instanceof Uint8Array) {
		txBytes = transaction;
	} else if (typeof transaction === "string") {
		const hex = transaction.startsWith("0x")
			? transaction.slice(2)
			: transaction;
		if (hex.length % 2 !== 0) {
			throw new InvalidBundleError("Transaction has invalid hex length", {
				value: transaction,
				expected: "even-length hex string",
				context: { hexLength: hex.length },
			});
		}
		txBytes = new Uint8Array(hex.length / 2);
		for (let i = 0; i < hex.length; i += 2) {
			txBytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
		}
	} else {
		throw new InvalidBundleError("Transaction must be Uint8Array or hex string", {
			value: transaction,
			expected: "Uint8Array or hex string",
		});
	}

	return {
		...bundle,
		transactions: [...bundle.transactions, txBytes],
	};
}
