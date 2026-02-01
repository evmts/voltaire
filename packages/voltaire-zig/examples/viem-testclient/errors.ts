/**
 * Test Client Errors - Copyable Implementation
 *
 * Copy these error classes into your codebase and customize as needed.
 *
 * @module examples/viem-testclient/errors
 */

/**
 * Error thrown when an unsupported mode is used
 */
export class UnsupportedModeError extends Error {
	override readonly name = "UnsupportedModeError";

	constructor(mode: string, action: string) {
		super(`Action "${action}" is not supported in ${mode} mode`);
	}
}

/**
 * Error thrown when a test action fails
 */
export class TestActionError extends Error {
	override readonly name = "TestActionError";

	constructor(
		action: string,
		public readonly cause?: unknown,
	) {
		super(`Test action "${action}" failed`);
	}
}

/**
 * Error thrown when snapshot/revert fails
 */
export class SnapshotError extends Error {
	override readonly name = "SnapshotError";

	constructor(
		action: "snapshot" | "revert",
		public readonly cause?: unknown,
	) {
		super(`Failed to ${action} EVM state`);
	}
}

/**
 * Error thrown when impersonation fails
 */
export class ImpersonationError extends Error {
	override readonly name = "ImpersonationError";

	constructor(
		address: string,
		action: "impersonate" | "stopImpersonating",
		public readonly cause?: unknown,
	) {
		super(`Failed to ${action} account ${address}`);
	}
}

/**
 * Error thrown when state manipulation fails
 */
export class StateManipulationError extends Error {
	override readonly name = "StateManipulationError";

	constructor(
		action: string,
		address: string,
		public readonly cause?: unknown,
	) {
		super(`Failed to ${action} for address ${address}`);
	}
}

/**
 * Error thrown when time manipulation fails
 */
export class TimeManipulationError extends Error {
	override readonly name = "TimeManipulationError";

	constructor(
		action: string,
		public readonly cause?: unknown,
	) {
		super(`Failed to ${action}`);
	}
}

/**
 * Error thrown when mining fails
 */
export class MiningError extends Error {
	override readonly name = "MiningError";

	constructor(
		blocks: number,
		public readonly cause?: unknown,
	) {
		super(`Failed to mine ${blocks} block(s)`);
	}
}
