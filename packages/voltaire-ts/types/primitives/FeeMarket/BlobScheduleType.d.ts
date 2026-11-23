import type { HardforkType } from "../Hardfork/HardforkType.js";
/**
 * Per-fork blob fee market parameters (EIP-7840 / EIP-7691 / EIP-7892).
 *
 * `target` and `max` count blobs per block.
 */
export interface BlobScheduleType {
    /** Target number of blobs per block */
    readonly target: bigint;
    /** Maximum number of blobs per block */
    readonly max: bigint;
    /** Denominator of the exponential blob base fee update formula */
    readonly baseFeeUpdateFraction: bigint;
}
/**
 * Hardfork name accepted by blob fee market helpers.
 *
 * Case-insensitive; includes the EIP-7892 blob-parameter-only forks
 * `"bpo1"` / `"bpo2"`. Unknown names throw `InvalidRangeError` at runtime.
 */
export type BlobHardforkName = HardforkType | "bpo1" | "bpo2" | (string & {});
/**
 * Fork context for blob fee market helpers (EIP-7691 / EIP-7892 / EIP-7918).
 *
 * Schedule precedence: `schedule` > `timestamp` > `hardfork` > Cancun.
 * EIP-7918 precedence: `reservePrice` > `timestamp` > `hardfork`.
 */
export interface BlobForkContext {
    /** Active hardfork of the block being built, case-insensitive (`"bpo1"`/`"bpo2"` count as Osaka+) */
    readonly hardfork?: BlobHardforkName;
    /** Mainnet block timestamp in Unix seconds; takes precedence over `hardfork` */
    readonly timestamp?: bigint | number;
    /** Explicit custom or preset blob schedule (overrides schedule derived from `timestamp`/`hardfork`) */
    readonly schedule?: BlobScheduleType;
    /** Explicitly enable or disable the EIP-7918 reserve price rule */
    readonly reservePrice?: boolean;
}
/**
 * Options for fork-aware excess blob gas calculation (EIP-7691 / EIP-7892 / EIP-7918).
 */
export interface CalculateExcessBlobGasOptions extends BlobForkContext {
    /** Parent block execution base fee per gas in wei (required when EIP-7918 reserve pricing applies) */
    readonly parentBaseFeePerGas?: bigint;
}
/** Alias for {@link CalculateExcessBlobGasOptions}. */
export type ExcessBlobGasOptions = CalculateExcessBlobGasOptions;
//# sourceMappingURL=BlobScheduleType.d.ts.map