/**
 * Viem-style Contract Errors - Copyable Implementation
 *
 * Error classes that mirror viem's contract error patterns.
 * Copy this into your codebase and customize as needed.
 *
 * @module examples/viem-contract/errors
 */

import type { Item } from "../../src/primitives/Abi/AbiType.js";

/**
 * Base error for all contract-related errors
 */
export class ContractError extends Error {
	override readonly name = "ContractError";

	constructor(
		message: string,
		public readonly details: {
			abi?: readonly Item[];
			address?: string;
			functionName?: string;
			args?: readonly unknown[];
			docsPath?: string;
		},
		options?: { cause?: unknown },
	) {
		super(message, options);
	}
}

/**
 * Error thrown when reading from a contract fails
 */
export class ContractReadError extends ContractError {
	override readonly name = "ContractReadError";

	constructor(
		functionName: string,
		details: {
			abi?: readonly Item[];
			address?: string;
			args?: readonly unknown[];
		},
		options?: { cause?: unknown },
	) {
		super(
			`Failed to read from contract function "${functionName}"`,
			{ ...details, functionName, docsPath: "/docs/contract/readContract" },
			options,
		);
	}
}

/**
 * Error thrown when writing to a contract fails
 */
export class ContractWriteError extends ContractError {
	override readonly name = "ContractWriteError";

	constructor(
		functionName: string,
		details: {
			abi?: readonly Item[];
			address?: string;
			args?: readonly unknown[];
			sender?: string;
		},
		options?: { cause?: unknown },
	) {
		super(
			`Failed to write to contract function "${functionName}"`,
			{ ...details, functionName, docsPath: "/docs/contract/writeContract" },
			options,
		);
	}
}

/**
 * Error thrown when simulating a contract call fails
 */
export class ContractSimulateError extends ContractError {
	override readonly name = "ContractSimulateError";

	constructor(
		functionName: string,
		details: {
			abi?: readonly Item[];
			address?: string;
			args?: readonly unknown[];
			sender?: string;
		},
		options?: { cause?: unknown },
	) {
		super(
			`Contract simulation failed for function "${functionName}"`,
			{ ...details, functionName, docsPath: "/docs/contract/simulateContract" },
			options,
		);
	}
}

/**
 * Error thrown when gas estimation fails
 */
export class ContractGasEstimationError extends ContractError {
	override readonly name = "ContractGasEstimationError";

	constructor(
		functionName: string,
		details: {
			abi?: readonly Item[];
			address?: string;
			args?: readonly unknown[];
			sender?: string;
		},
		options?: { cause?: unknown },
	) {
		super(
			`Gas estimation failed for function "${functionName}"`,
			{
				...details,
				functionName,
				docsPath: "/docs/contract/estimateContractGas",
			},
			options,
		);
	}
}

/**
 * Error thrown when account is not found
 */
export class AccountNotFoundError extends Error {
	override readonly name = "AccountNotFoundError";

	constructor(docsPath?: string) {
		super(
			`No account provided. Set \`account\` in params or on the client.${
				docsPath ? ` See: ${docsPath}` : ""
			}`,
		);
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
 * Error thrown when an event watch subscription fails
 */
export class ContractEventWatchError extends Error {
	override readonly name = "ContractEventWatchError";

	constructor(
		eventName: string | undefined,
		public readonly cause?: unknown,
	) {
		super(
			`Failed to watch contract event${eventName ? ` "${eventName}"` : ""}`,
		);
	}
}
