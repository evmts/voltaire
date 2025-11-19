import { InvalidReceiptError } from "./errors.js";

/**
 * Create Receipt from partial data
 *
 * @param {Omit<import('./ReceiptType.js').ReceiptType, typeof import('../../brand.js').brand>} data
 * @returns {import('./ReceiptType.js').ReceiptType}
 * @throws {InvalidReceiptError}
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
	if (!data.cumulativeGasUsed) {
		throw new InvalidReceiptError("cumulativeGasUsed is required");
	}
	if (!data.gasUsed) {
		throw new InvalidReceiptError("gasUsed is required");
	}
	if (!data.logs) {
		throw new InvalidReceiptError("logs are required");
	}
	if (!data.logsBloom) {
		throw new InvalidReceiptError("logsBloom is required");
	}
	if (data.logsBloom.length !== 256) {
		throw new InvalidReceiptError("logsBloom must be 256 bytes", {
			context: { actualLength: data.logsBloom.length },
		});
	}
	if (!data.status) {
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
