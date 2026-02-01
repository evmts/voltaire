/**
 * RevertReason - Decoded revert information from contract execution
 *
 * Union type representing different types of contract reverts:
 * - Error: Standard Error(string) revert
 * - Panic: Solidity 0.8+ panic codes
 * - Custom: Custom error with selector and encoded data
 * - Unknown: Unrecognized revert data
 */
/**
 * Standard Error(string) revert
 */
export type ErrorRevertReason = {
    readonly type: "Error";
    readonly message: string;
};
/**
 * Solidity 0.8+ Panic(uint256) revert
 */
export type PanicRevertReason = {
    readonly type: "Panic";
    readonly code: number;
    readonly description: string;
};
/**
 * Custom error with selector and data
 */
export type CustomRevertReason = {
    readonly type: "Custom";
    readonly selector: string;
    readonly data: Uint8Array;
};
/**
 * Unknown/unrecognized revert
 */
export type UnknownRevertReason = {
    readonly type: "Unknown";
    readonly data: Uint8Array;
};
/**
 * RevertReason union type
 */
export type RevertReasonType = ErrorRevertReason | PanicRevertReason | CustomRevertReason | UnknownRevertReason;
//# sourceMappingURL=RevertReasonType.d.ts.map