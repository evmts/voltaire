import type { HardforkType } from "../Hardfork/HardforkType.js";
/**
 * Options for {@link validateGasLimit}.
 */
export type ValidateGasLimitOptions = {
    /** Hardfork the transaction executes under. Defaults to the latest stable fork. */
    hardfork?: HardforkType;
    /** Block gas limit; the transaction gas limit may not exceed it. */
    blockGasLimit?: bigint;
};
/**
 * Validate a transaction gas limit.
 *
 * - The gas limit must be positive.
 * - From Osaka (the default hardfork), it must not exceed the EIP-7825 cap of
 *   `2^24` (16,777,216) gas.
 * - If `blockGasLimit` is given, it must not exceed the block gas limit.
 *
 * @param this Transaction
 * @param options Hardfork and optional block gas limit
 * @throws {InvalidRangeError} If gas limit is non-positive or exceeds a cap
 */
export declare function validateGasLimit(this: {
    gasLimit: bigint;
}, options?: ValidateGasLimitOptions): void;
//# sourceMappingURL=validateGasLimit.d.ts.map