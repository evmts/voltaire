import { InvalidReceiptError, InvalidReceiptLengthError } from "./errors.js";

/**
 * Create Receipt from partial data
 *
 * @see https://voltaire.tevm.sh/primitives/receipt for Receipt documentation
 * @since 0.0.0
 * @param {Omit<import('./ReceiptType.js').ReceiptType, typeof import('../../brand.js').brand>} data
 * @returns {import('./ReceiptType.js').ReceiptType}
 * @throws {InvalidReceiptError} If required field is missing
 * @throws {InvalidReceiptLengthError} If logsBloom has wrong length
 * @example
 * ```javascript
 * import * as Receipt from './primitives/Receipt/index.js';
 * const receipt = Receipt.from({
 *   transactionHash: txHash,
 *   transactionIndex: 0,
 *   blockHash: blockHash,
 *   // ... other fields
 * });
 * ```
 */
export function from(data) {
	// Validate required fields
	if (!data.transactionHash) {
		throw new InvalidReceiptError("transactionHash is required");
	}
	if (data.transactionIndex === undefined) {
		throw new InvalidReceiptError("transactionIndex is required");
	}
	if (!data.blockHash) {
		throw new InvalidReceiptError("blockHash is required");
	}
	if (data.blockNumber === undefined) {
		throw new InvalidReceiptError("blockNumber is required");
	}
	if (!data.from) {
		throw new InvalidReceiptError("from address is required");
	}
	if (data.cumulativeGasUsed === undefined) {
		throw new InvalidReceiptError("cumulativeGasUsed is required");
	}
	if (data.gasUsed === undefined) {
		throw new InvalidReceiptError("gasUsed is required");
	}
	if (!data.logs) {
		throw new InvalidReceiptError("logs are required");
	}
	if (!data.logsBloom) {
		throw new InvalidReceiptError("logsBloom is required");
	}
	if (data.logsBloom.length !== 256) {
		throw new InvalidReceiptLengthError(
			"logsBloom",
			256,
			data.logsBloom.length,
		);
	}
	if (data.status === undefined) {
		throw new InvalidReceiptError("status is required");
	}
	if (!data.effectiveGasPrice) {
		throw new InvalidReceiptError("effectiveGasPrice is required");
	}
	if (!data.type) {
		throw new InvalidReceiptError("type is required");
	}

	return /** @type {import('./ReceiptType.js').ReceiptType} */ (data);
}
