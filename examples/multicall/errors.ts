/**
 * Multicall Error Classes
 *
 * Custom errors for the multicall abstraction.
 *
 * @module examples/multicall/errors
 */

/**
 * Error thrown when Multicall3 is not available on the target chain
 */
export class MulticallNotSupportedError extends Error {
	override readonly name = "MulticallNotSupportedError";

	constructor(
		public readonly chainId?: number,
		message?: string,
	) {
		super(
			message ??
				`Multicall3 is not available on chain ${chainId ?? "unknown"}. ` +
					"Provide a custom multicallAddress or use deployless mode.",
		);
	}
}

/**
 * Error thrown when ABI encoding fails for a contract call
 */
export class MulticallEncodingError extends Error {
	override readonly name = "MulticallEncodingError";

	constructor(
		public readonly contractIndex: number,
		public readonly functionName: string,
		public readonly cause?: unknown,
	) {
		super(
			`Failed to encode call #${contractIndex} (${functionName}): ${cause instanceof Error ? cause.message : String(cause)}`,
		);
	}
}

/**
 * Error thrown when ABI decoding fails for a contract result
 */
export class MulticallDecodingError extends Error {
	override readonly name = "MulticallDecodingError";

	constructor(
		public readonly contractIndex: number,
		public readonly functionName: string,
		public readonly cause?: unknown,
	) {
		super(
			`Failed to decode result #${contractIndex} (${functionName}): ${cause instanceof Error ? cause.message : String(cause)}`,
		);
	}
}

/**
 * Error thrown when the eth_call to Multicall3 fails
 */
export class MulticallRpcError extends Error {
	override readonly name = "MulticallRpcError";

	constructor(
		public readonly batchIndex: number,
		public readonly cause?: unknown,
	) {
		super(
			`Multicall batch #${batchIndex} failed: ${cause instanceof Error ? cause.message : String(cause)}`,
		);
	}
}

/**
 * Error thrown when a contract call within the multicall reverts
 */
export class MulticallContractError extends Error {
	override readonly name = "MulticallContractError";

	constructor(
		public readonly contractIndex: number,
		public readonly functionName: string,
		public readonly address: string,
		public readonly revertData?: string,
	) {
		super(
			`Call #${contractIndex} to ${functionName} at ${address} reverted` +
				(revertData ? ` with: ${revertData}` : ""),
		);
	}
}

/**
 * Error thrown when the call returns empty data (0x)
 *
 * This usually means:
 * - Contract not deployed at address
 * - Wrong function selector
 * - Call to EOA (externally owned account)
 */
export class MulticallZeroDataError extends Error {
	override readonly name = "MulticallZeroDataError";

	constructor(
		public readonly contractIndex: number,
		public readonly functionName: string,
		public readonly address: string,
	) {
		super(
			`Call #${contractIndex} to ${functionName} at ${address} returned empty data (0x). ` +
				"The contract may not be deployed or the function may not exist.",
		);
	}
}

/**
 * Error thrown when results count doesn't match contracts count
 *
 * This indicates an internal error in the multicall implementation.
 */
export class MulticallResultsMismatchError extends Error {
	override readonly name = "MulticallResultsMismatchError";

	constructor(
		public readonly expected: number,
		public readonly actual: number,
	) {
		super(
			`Multicall results mismatch: expected ${expected} results but got ${actual}`,
		);
	}
}

/**
 * Aggregate multicall error containing multiple failures
 *
 * Thrown when `allowFailure: false` and any call fails.
 */
export class MulticallAggregateError extends Error {
	override readonly name = "MulticallAggregateError";

	constructor(
		public readonly errors: Array<{
			index: number;
			error: Error;
		}>,
	) {
		const firstError = errors[0];
		super(
			`${errors.length} multicall(s) failed. First error at index ${firstError.index}: ${firstError.error.message}`,
		);
	}
}
