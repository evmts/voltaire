/**
 * Ethers-style Contract Errors - Copyable Implementation
 *
 * Error classes following ethers v6 patterns.
 * Copy into your codebase and customize as needed.
 *
 * @module examples/ethers-contract/errors
 */

/**
 * Base error for contract operations
 */
export class ContractError extends Error {
	override readonly name = "ContractError";
	readonly code: string;

	constructor(
		message: string,
		code: string,
		public readonly info?: unknown,
	) {
		super(message);
		this.code = code;
	}
}

/**
 * Error when runner lacks required capability
 */
export class UnsupportedOperationError extends ContractError {
	override readonly name = "UnsupportedOperationError";

	constructor(operation: string, info?: unknown) {
		super(
			`contract runner does not support ${operation}`,
			"UNSUPPORTED_OPERATION",
			info,
		);
	}
}

/**
 * Error when contract call reverts
 */
export class CallExceptionError extends ContractError {
	override readonly name = "CallExceptionError";

	readonly revert?: {
		name: string;
		signature: string;
		args: unknown[];
	};

	readonly invocation?: {
		method: string;
		signature: string;
		args: unknown[];
	};

	readonly transaction?: {
		to?: string;
		data?: string;
		value?: bigint;
	};

	constructor(
		message: string,
		opts?: {
			revert?: { name: string; signature: string; args: unknown[] };
			invocation?: { method: string; signature: string; args: unknown[] };
			transaction?: { to?: string; data?: string; value?: bigint };
			info?: unknown;
		},
	) {
		super(message, "CALL_EXCEPTION", opts?.info);
		this.revert = opts?.revert;
		this.invocation = opts?.invocation;
		this.transaction = opts?.transaction;
	}
}

/**
 * Error for invalid arguments
 */
export class InvalidArgumentError extends ContractError {
	override readonly name = "InvalidArgumentError";

	readonly argument: string;
	readonly value: unknown;

	constructor(argument: string, message: string, value: unknown) {
		super(message, "INVALID_ARGUMENT", { argument, value });
		this.argument = argument;
		this.value = value;
	}
}

/**
 * Error when function is not found in ABI
 */
export class FunctionNotFoundError extends ContractError {
	override readonly name = "FunctionNotFoundError";

	constructor(key: string, args?: unknown[]) {
		super(`no matching function (key="${key}")`, "INVALID_ARGUMENT", {
			key,
			args,
		});
	}
}

/**
 * Error when event is not found in ABI
 */
export class EventNotFoundError extends ContractError {
	override readonly name = "EventNotFoundError";

	constructor(key: string) {
		super(`no matching event (key="${key}")`, "INVALID_ARGUMENT", { key });
	}
}

/**
 * Error for ambiguous function/event match
 */
export class AmbiguousMatchError extends ContractError {
	override readonly name = "AmbiguousMatchError";

	constructor(type: "function" | "event", key: string, matches: string[]) {
		super(
			`ambiguous ${type} description (matches ${matches.join(", ")})`,
			"INVALID_ARGUMENT",
			{ key, matches },
		);
	}
}

/**
 * Error when ENS name cannot be resolved
 */
export class UnconfiguredNameError extends ContractError {
	override readonly name = "UnconfiguredNameError";

	constructor(name: string) {
		super(
			`an ENS name used for a contract target must be correctly configured (name="${name}")`,
			"UNCONFIGURED_NAME",
			{ name },
		);
	}
}

/**
 * Panic reasons from Solidity
 */
export const PanicReasons: Record<string, string> = {
	"0": "generic panic",
	"1": "assert(false)",
	"17": "arithmetic overflow",
	"18": "division or modulo by zero",
	"33": "enum overflow",
	"34": "invalid encoded storage byte array accessed",
	"49": "out-of-bounds array access; popping on an empty array",
	"50": "out-of-bounds access of an array or bytesN",
	"65": "out of memory",
	"81": "uninitialized function",
};

/**
 * Decode revert data into human-readable error
 */
export function decodeRevertReason(data: Uint8Array): string | null {
	if (data.length < 4) return null;

	const selector = `0x${data[0].toString(16).padStart(2, "0")}${data[1].toString(16).padStart(2, "0")}${data[2].toString(16).padStart(2, "0")}${data[3].toString(16).padStart(2, "0")}`;

	// Error(string) - 0x08c379a0
	if (selector === "0x08c379a0" && data.length >= 68) {
		try {
			const offset = 4 + 32; // skip selector + offset
			const length = Number(
				BigInt(
					`0x${Array.from(data.slice(offset, offset + 32))
						.map((b) => b.toString(16).padStart(2, "0"))
						.join("")}`,
				),
			);
			const msgBytes = data.slice(offset + 32, offset + 32 + length);
			const message = new TextDecoder().decode(msgBytes);
			return `reverted with reason string "${message}"`;
		} catch {
			return null;
		}
	}

	// Panic(uint256) - 0x4e487b71
	if (selector === "0x4e487b71" && data.length >= 36) {
		try {
			const code = Number(
				BigInt(
					`0x${Array.from(data.slice(4, 36))
						.map((b) => b.toString(16).padStart(2, "0"))
						.join("")}`,
				),
			);
			const reason = PanicReasons[code.toString()] || "unknown panic code";
			return `reverted with panic code 0x${code.toString(16)} (${reason})`;
		} catch {
			return null;
		}
	}

	return null;
}
