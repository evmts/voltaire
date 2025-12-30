/**
 * PublicClient Errors
 *
 * Domain-specific error types for PublicClient operations.
 *
 * @module examples/viem-publicclient/errors
 */

/**
 * Base error for PublicClient operations
 */
export class PublicClientError extends Error {
	override name = "PublicClientError";

	constructor(
		message: string,
		public cause?: unknown,
	) {
		super(message);
	}
}

/**
 * URL required for HTTP transport
 */
export class UrlRequiredError extends PublicClientError {
	override name = "UrlRequiredError";

	constructor() {
		super(
			"No URL was provided to the HTTP transport. Please provide a valid RPC URL.",
		);
	}
}

/**
 * Transaction not found
 */
export class TransactionNotFoundError extends PublicClientError {
	override name = "TransactionNotFoundError";

	constructor(
		public details: {
			hash?: string;
			blockHash?: string;
			blockNumber?: bigint;
			index?: number;
		},
	) {
		super(
			details.hash
				? `Transaction not found: ${details.hash}`
				: `Transaction not found at index ${details.index} in block`,
		);
	}
}

/**
 * Block not found
 */
export class BlockNotFoundError extends PublicClientError {
	override name = "BlockNotFoundError";

	constructor(public details: { blockHash?: string; blockNumber?: bigint }) {
		super(
			details.blockHash
				? `Block not found: ${details.blockHash}`
				: `Block not found: ${details.blockNumber}`,
		);
	}
}

/**
 * RPC request error
 */
export class RpcRequestError extends PublicClientError {
	override name = "RpcRequestError";

	constructor(
		public details: {
			body: unknown;
			error: { code: number; message: string };
			url: string;
		},
	) {
		super(`RPC Error: ${details.error.message} (code: ${details.error.code})`);
	}
}

/**
 * Contract execution reverted
 */
export class ContractRevertError extends PublicClientError {
	override name = "ContractRevertError";

	constructor(
		public details: {
			data?: string;
			message?: string;
		},
	) {
		super(details.message ?? "Contract execution reverted");
	}
}

/**
 * Insufficient funds for transaction
 */
export class InsufficientFundsError extends PublicClientError {
	override name = "InsufficientFundsError";

	constructor() {
		super("Insufficient funds for transaction");
	}
}

/**
 * Timeout error
 */
export class TimeoutError extends PublicClientError {
	override name = "TimeoutError";

	constructor(public timeout: number) {
		super(`Request timed out after ${timeout}ms`);
	}
}
