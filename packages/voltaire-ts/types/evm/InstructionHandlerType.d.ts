import type { BrandedFrame, EvmError } from "./Frame/FrameType.js";
import type { BrandedHost } from "./Host/HostType.js";
/**
 * InstructionHandler - Function signature for EVM opcode handlers
 *
 * Each opcode is implemented as a function that mutates the frame state
 * and returns success or an error.
 *
 * Based on guillotine-mini instruction handler pattern.
 *
 * @example
 * ```typescript
 * // ADD opcode handler (0x01)
 * const addHandler: InstructionHandler = (frame: BrandedFrame, host: BrandedHost) => {
 *   if (frame.stack.length < 2) {
 *     return { type: "StackUnderflow" };
 *   }
 *   const b = frame.stack.pop()!;
 *   const a = frame.stack.pop()!;
 *   frame.stack.push((a + b) % 2n**256n); // Mod 2^256
 *   return { type: "Success" };
 * };
 * ```
 */
export type InstructionHandler = (frame: BrandedFrame, host: BrandedHost) => EvmError | {
    type: "Success";
};
/**
 * CallType - EVM call operation types
 *
 * Determines context preservation for cross-contract calls.
 */
export type CallType = "CALL" | "STATICCALL" | "DELEGATECALL" | "CALLCODE";
/**
 * CallParams - Parameters for EVM call operations
 *
 * Used by CALL, STATICCALL, DELEGATECALL, CALLCODE opcodes.
 *
 * @example
 * ```typescript
 * const params: CallParams = {
 *   callType: "CALL",
 *   target: targetAddress,
 *   value: 1000000000000000000n, // 1 ether in wei
 *   gasLimit: 100000n,
 *   input: calldata,
 *   caller: frame.address,
 *   isStatic: false,
 * };
 * ```
 */
export type CallParams = {
    /** Type of call operation */
    callType: CallType;
    /** Target contract address */
    target: import("../primitives/Address/AddressType.js").AddressType;
    /** Value to transfer (wei) */
    value: bigint;
    /** Gas limit for call */
    gasLimit: bigint;
    /** Input data (calldata) */
    input: Uint8Array;
    /** Caller address */
    caller: import("../primitives/Address/AddressType.js").AddressType;
    /** Static call flag (write protection) */
    isStatic: boolean;
    /** Call depth */
    depth: number;
};
/**
 * CallResult - Result of EVM call operation
 *
 * Returned by call operations (CALL, STATICCALL, DELEGATECALL, etc.)
 *
 * @example
 * ```typescript
 * // Successful call
 * const result: CallResult = {
 *   success: true,
 *   gasUsed: 21000n,
 *   output: returnData,
 *   logs: [{ address, topics, data }],
 *   gasRefund: 0n,
 * };
 *
 * // Failed call (reverted)
 * const revertResult: CallResult = {
 *   success: false,
 *   gasUsed: 50000n,
 *   output: revertReason,
 *   logs: [],
 *   gasRefund: 0n,
 * };
 * ```
 */
export type CallResult = {
    /** Whether call succeeded (false if reverted) */
    success: boolean;
    /** Gas consumed by call */
    gasUsed: bigint;
    /** Return data or revert reason */
    output: Uint8Array;
    /** Logs emitted during call */
    logs: Array<{
        address: import("../primitives/Address/AddressType.js").AddressType;
        topics: bigint[];
        data: Uint8Array;
    }>;
    /** Gas refund from storage deletions */
    gasRefund: bigint;
};
/**
 * CreateParams - Parameters for contract creation
 *
 * Used by CREATE and CREATE2 opcodes.
 *
 * @example
 * ```typescript
 * // CREATE2 with deterministic address
 * const params: CreateParams = {
 *   caller: deployerAddress,
 *   value: 0n,
 *   initCode: contractBytecode,
 *   gasLimit: 1000000n,
 *   salt: 0x123n, // For CREATE2
 * };
 * ```
 */
export type CreateParams = {
    /** Deployer address */
    caller: import("../primitives/Address/AddressType.js").AddressType;
    /** Value to transfer (wei) */
    value: bigint;
    /** Initialization code */
    initCode: Uint8Array;
    /** Gas limit for deployment */
    gasLimit: bigint;
    /** Salt for CREATE2 (optional) */
    salt?: bigint;
    /** Call depth */
    depth: number;
};
/**
 * CreateResult - Result of contract creation
 *
 * Returned by CREATE and CREATE2 operations.
 *
 * @example
 * ```typescript
 * // Successful deployment
 * const result: CreateResult = {
 *   success: true,
 *   address: newContractAddress,
 *   gasUsed: 200000n,
 *   output: runtimeCode,
 * };
 *
 * // Failed deployment
 * const failResult: CreateResult = {
 *   success: false,
 *   address: null,
 *   gasUsed: 100000n,
 *   output: revertReason,
 * };
 * ```
 */
export type CreateResult = {
    /** Whether deployment succeeded */
    success: boolean;
    /** Address of deployed contract (null if failed) */
    address: import("../primitives/Address/AddressType.js").AddressType | null;
    /** Gas consumed by deployment */
    gasUsed: bigint;
    /** Runtime code or revert reason */
    output: Uint8Array;
    /** Gas refund */
    gasRefund: bigint;
};
//# sourceMappingURL=InstructionHandlerType.d.ts.map