/**
 * Contract errors - Copyable Implementation
 *
 * Copy these error classes into your codebase and customize as needed.
 *
 * @module examples/contract/errors
 */

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
