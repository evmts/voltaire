/**
 * Contract module errors
 *
 * @module contract/errors
 */

/**
 * Error thrown when a Contract method is not yet implemented
 */
export class ContractNotImplementedError extends Error {
	override readonly name = "ContractNotImplementedError";

	constructor(method: string) {
		super(`Contract.${method} is not yet implemented`);
	}
}

/**
 * Error thrown when a function is not found in the ABI
 */
export class ContractFunctionNotFoundError extends Error {
	override readonly name = "ContractFunctionNotFoundError";

	constructor(functionName: string) {
		super(`Function "${functionName}" not found in contract ABI`);
	}
}

/**
 * Error thrown when an event is not found in the ABI
 */
export class ContractEventNotFoundError extends Error {
	override readonly name = "ContractEventNotFoundError";

	constructor(eventName: string) {
		super(`Event "${eventName}" not found in contract ABI`);
	}
}

/**
 * Error thrown when a read call fails
 */
export class ContractReadError extends Error {
	override readonly name = "ContractReadError";

	constructor(
		functionName: string,
		public readonly cause?: unknown,
	) {
		super(`Failed to read "${functionName}" from contract`);
	}
}

/**
 * Error thrown when a write call fails
 */
export class ContractWriteError extends Error {
	override readonly name = "ContractWriteError";

	constructor(
		functionName: string,
		public readonly cause?: unknown,
	) {
		super(`Failed to write "${functionName}" to contract`);
	}
}

/**
 * Error thrown when RPC returns "block range too large" error
 *
 * This indicates the eth_getLogs request exceeded the RPC provider's
 * block range limit and the request should be retried with a smaller range.
 */
export class BlockRangeTooLargeError extends Error {
	override readonly name = "BlockRangeTooLargeError";

	constructor(
		public readonly fromBlock: bigint,
		public readonly toBlock: bigint,
		public readonly cause?: unknown,
	) {
		super(`Block range too large: ${fromBlock} to ${toBlock}`);
	}
}

/**
 * Error thrown when an EventStream operation is aborted
 *
 * This occurs when the AbortSignal passed to backfill/watch is triggered.
 */
export class EventStreamAbortedError extends Error {
	override readonly name = "EventStreamAbortedError";

	constructor() {
		super("Event stream was aborted");
	}
}
