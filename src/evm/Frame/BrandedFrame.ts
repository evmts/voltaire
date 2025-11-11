import type { Address } from "../../primitives/Address/BrandedAddress.js";
import type { Hex } from "../../primitives/Hex/BrandedHex.js";

/**
 * BrandedFrame - EVM execution frame
 *
 * Represents an EVM execution frame with stack, memory, gas accounting,
 * and execution state. Based on guillotine-mini Frame structure.
 */
export type BrandedFrame = {
	readonly __tag: "Frame";

	// Stack (max 1024 items)
	stack: bigint[];

	// Memory (sparse map)
	memory: Map<number, number>;
	memorySize: number; // Word-aligned size

	// Execution state
	pc: number; // Program counter
	gasRemaining: bigint;
	bytecode: Uint8Array;

	// Call context
	caller: Address;
	address: Address;
	value: bigint;
	calldata: Uint8Array;
	output: Uint8Array;
	returnData: Uint8Array;

	// Flags
	stopped: boolean;
	reverted: boolean;
	isStatic: boolean;

	// Other
	authorized: bigint | null;
	callDepth: number;

	// Block context (optional, for block opcodes)
	blockNumber?: bigint;
	blockTimestamp?: bigint;
	blockGasLimit?: bigint;
	blockDifficulty?: bigint;
	blockPrevrandao?: bigint;
	blockBaseFee?: bigint;
	chainId?: bigint;
	blobBaseFee?: bigint;
};

/**
 * EvmError - Frame execution errors
 */
export type EvmError =
	| { type: "StackOverflow" }
	| { type: "StackUnderflow" }
	| { type: "OutOfGas" }
	| { type: "OutOfBounds" }
	| { type: "InvalidJump" }
	| { type: "InvalidOpcode" }
	| { type: "RevertExecuted" }
	| { type: "CallDepthExceeded" }
	| { type: "WriteProtection" }
	| { type: "InsufficientBalance" };
