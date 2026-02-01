/**
 * Shared utilities for CALL-type opcodes (CALL, CALLCODE, DELEGATECALL, STATICCALL)
 */
/**
 * Pop value from stack
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @returns {{value: bigint, error: null} | {value: null, error: import("../Frame/FrameType.js").EvmError}}
 */
export function popStack(frame: import("../Frame/FrameType.js").BrandedFrame): {
    value: bigint;
    error: null;
} | {
    value: null;
    error: import("../Frame/FrameType.js").EvmError;
};
/**
 * Push value to stack
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @param {bigint} value
 * @returns {import("../Frame/FrameType.js").EvmError | null}
 */
export function pushStack(frame: import("../Frame/FrameType.js").BrandedFrame, value: bigint): import("../Frame/FrameType.js").EvmError | null;
/**
 * Consume gas from frame
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @param {bigint} amount
 * @returns {import("../Frame/FrameType.js").EvmError | null}
 */
export function consumeGas(frame: import("../Frame/FrameType.js").BrandedFrame, amount: bigint): import("../Frame/FrameType.js").EvmError | null;
/**
 * Read byte from memory
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @param {number} offset
 * @returns {number}
 */
export function readMemory(frame: import("../Frame/FrameType.js").BrandedFrame, offset: number): number;
/**
 * Write byte to memory
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @param {number} offset
 * @param {number} value
 */
export function writeMemory(frame: import("../Frame/FrameType.js").BrandedFrame, offset: number, value: number): void;
/**
 * Calculate word count (32-byte words)
 * @param {number} bytes
 * @returns {number}
 */
export function wordCount(bytes: number): number;
/**
 * Calculate word-aligned size
 * @param {number} bytes
 * @returns {number}
 */
export function wordAlignedSize(bytes: number): number;
/**
 * Calculate memory expansion cost
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame
 * @param {number} endBytes
 * @returns {bigint}
 */
export function memoryExpansionCost(frame: import("../Frame/FrameType.js").BrandedFrame, endBytes: number): bigint;
/**
 * Convert bigint address to 20-byte Uint8Array
 * @param {bigint} addr
 * @returns {import("../../primitives/Address/AddressType.js").AddressType}
 */
export function bigintToAddress(addr: bigint): import("../../primitives/Address/AddressType.js").AddressType;
//# sourceMappingURL=callUtils.d.ts.map