import type { brand } from "../../brand.js";
import type { AddressType as Address } from "../../primitives/Address/AddressType.js";
import type { HardforkType } from "../../primitives/Hardfork/HardforkType.js";
/**
 * BrandedFrame - EVM execution frame
 *
 * Represents an EVM execution frame with stack, memory, gas accounting,
 * and execution state. Based on guillotine-mini Frame structure.
 */
export type BrandedFrame = {
    readonly [brand]: "Frame";
    stack: bigint[];
    memory: Map<number, number>;
    memorySize: number;
    pc: number;
    gasRemaining: bigint;
    bytecode: Uint8Array;
    caller: Address;
    address: Address;
    value: bigint;
    calldata: Uint8Array;
    output: Uint8Array;
    returnData: Uint8Array;
    stopped: boolean;
    reverted: boolean;
    isStatic: boolean;
    authorized: bigint | null;
    callDepth: number;
    hardfork?: HardforkType;
    accessedAddresses?: Set<string>;
    accessedStorageKeys?: Map<string, boolean>;
    storageOriginalValues?: Map<string, bigint>;
    gasRefunds?: bigint;
    blockNumber?: bigint;
    blockTimestamp?: bigint;
    blockGasLimit?: bigint;
    blockDifficulty?: bigint;
    blockPrevrandao?: bigint;
    blockBaseFee?: bigint;
    chainId?: bigint;
    blobBaseFee?: bigint;
    coinbase?: Address;
    blockHashes?: Map<bigint, bigint>;
    blobVersionedHashes?: bigint[];
    selfBalance?: bigint;
    logs?: Array<{
        address: Address;
        topics: bigint[];
        data: Uint8Array;
    }>;
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
export type EvmError = {
    type: "StackOverflow";
} | {
    type: "StackUnderflow";
} | {
    type: "OutOfGas";
} | {
    type: "OutOfBounds";
} | {
    type: "InvalidJump";
} | {
    type: "InvalidOpcode";
} | {
    type: "RevertExecuted";
} | {
    type: "CallDepthExceeded";
} | {
    type: "WriteProtection";
} | {
    type: "InsufficientBalance";
} | {
    type: "NotImplemented";
    message: string;
};
//# sourceMappingURL=FrameType.d.ts.map