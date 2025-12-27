import type { brand } from "../../brand.js";
import type { AddressType as Address } from "../../primitives/Address/AddressType.js";
import type { HardforkType } from "../../primitives/Hardfork/HardforkType.js";
import type { Hex } from "../../primitives/Hex/index.js";

/**
 * BrandedFrame - EVM execution frame
 *
 * Represents an EVM execution frame with stack, memory, gas accounting,
 * and execution state. Based on guillotine-mini Frame structure.
 */
export type BrandedFrame = {
	readonly [brand]: "Frame";

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

	// Hardfork configuration (for hardfork-aware gas pricing)
	hardfork?: HardforkType;

	// EIP-2929: Track warm/cold account and storage access (Berlin+)
	accessedAddresses?: Set<string>; // Warm addresses
	accessedStorageKeys?: Map<string, boolean>; // Warm storage slots (key is "address:slot")

	// Storage tracking (for EIP-2200 gas refunds)
	storageOriginalValues?: Map<string, bigint>; // Original values before tx started
	gasRefunds?: bigint; // Accumulated gas refunds

	// Block context (optional, for block opcodes)
	blockNumber?: bigint;
	blockTimestamp?: bigint;
	blockGasLimit?: bigint;
	blockDifficulty?: bigint;
	blockPrevrandao?: bigint;
	blockBaseFee?: bigint;
	chainId?: bigint;
	blobBaseFee?: bigint;
	coinbase?: Address;
	blockHashes?: Map<bigint, bigint>; // block number -> block hash (256 most recent)
	blobVersionedHashes?: bigint[]; // blob versioned hashes from tx
	selfBalance?: bigint; // balance of currently executing account

	// Logs (emitted by LOG0-LOG4 opcodes)
	logs?: Array<{
		address: Address;
		topics: bigint[];
		data: Uint8Array;
	}>;

	// Arithmetic instance methods (0x01-0x0b)
	add(): EvmError | null;
	mul(): EvmError | null;
	sub(): EvmError | null;
	div(): EvmError | null;
	sdiv(): EvmError | null;
	mod(): EvmError | null;
	smod(): EvmError | null;
	addmod(): EvmError | null;
	mulmod(): EvmError | null;
	exp(): EvmError | null;
	signextend(): EvmError | null;
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
