export * from "./BlobScheduleType.js";
export * from "./BlobTxFee.js";
export * from "./BlobTxFeeParams.js";
export * from "./BrandedState.js";
export * from "./Eip1559State.js";
export * from "./Eip4844State.js";
export * from "./FeeMarketType.js";
export * from "./State.js";
export * from "./TxFee.js";
export * from "./TxFeeParams.js";
export const Eip1559: typeof Eip1559Constants;
export const Eip4844: typeof Eip4844Constants;
/**
 * Blob schedule presets (CANCUN, PRAGUE, OSAKA, BPO1, BPO2), mainnet
 * activation timestamps, EIP-7918 constants, and lookup helpers.
 */
export const BlobSchedule: Readonly<{
    forHardfork: typeof blobScheduleForHardfork;
    forTimestamp: typeof blobScheduleForTimestamp;
    GAS_PER_BLOB: 131072n;
    MIN_BLOB_BASE_FEE: 1n;
    BLOB_BASE_COST: 8192n;
    CANCUN: Readonly<import("./BlobScheduleType.js").BlobScheduleType>;
    PRAGUE: Readonly<import("./BlobScheduleType.js").BlobScheduleType>;
    OSAKA: Readonly<import("./BlobScheduleType.js").BlobScheduleType>;
    BPO1: Readonly<import("./BlobScheduleType.js").BlobScheduleType>;
    BPO2: Readonly<import("./BlobScheduleType.js").BlobScheduleType>;
    CANCUN_BLOB_SCHEDULE: Readonly<import("./BlobScheduleType.js").BlobScheduleType>;
    PRAGUE_BLOB_SCHEDULE: Readonly<import("./BlobScheduleType.js").BlobScheduleType>;
    OSAKA_BLOB_SCHEDULE: Readonly<import("./BlobScheduleType.js").BlobScheduleType>;
    BPO1_BLOB_SCHEDULE: Readonly<import("./BlobScheduleType.js").BlobScheduleType>;
    BPO2_BLOB_SCHEDULE: Readonly<import("./BlobScheduleType.js").BlobScheduleType>;
    CANCUN_TIMESTAMP: 1710338135n;
    PRAGUE_TIMESTAMP: 1746612311n;
    OSAKA_TIMESTAMP: 1764798551n;
    BPO1_TIMESTAMP: 1765290071n;
    BPO2_TIMESTAMP: 1767747671n;
}>;
export type State = import("./FeeMarketType.js").FeeMarketType;
export namespace State {
    let next: (this: State, context?: import("./BlobScheduleType.js").BlobForkContext) => State;
    let getBlobBaseFee: (this: State, context?: import("./BlobScheduleType.js").BlobForkContext) => bigint;
    let getGasTarget: (this: State) => bigint;
    let isAboveGasTarget: (this: State) => boolean;
    let isAboveBlobGasTarget: (this: State, context?: import("./BlobScheduleType.js").BlobForkContext) => boolean;
}
import * as Eip1559Constants from "./eip1559Constants.js";
import * as Eip4844Constants from "./eip4844Constants.js";
import { blobScheduleForHardfork } from "./getBlobSchedule.js";
import { blobScheduleForTimestamp } from "./getBlobSchedule.js";
import { nextState as _nextState } from "./nextState.js";
import { BaseFee } from "./BaseFee.js";
import { BlobBaseFee } from "./BlobBaseFee.js";
import { calculateBlobBaseFee } from "./calculateBlobBaseFee.js";
import { calculateBlobTxFee } from "./calculateBlobTxFee.js";
import { calculateExcessBlobGas } from "./calculateExcessBlobGas.js";
import { calculateExcessBlobGasEip7918 } from "./calculateExcessBlobGas.js";
import { calculateTxFee } from "./calculateTxFee.js";
import { canIncludeTx } from "./canIncludeTx.js";
import { getBlobSchedule } from "./getBlobSchedule.js";
import { gweiToWei } from "./gweiToWei.js";
import { isBlobForkAtLeastOsaka } from "./normalizeBlobHardfork.js";
import { normalizeBlobHardfork } from "./normalizeBlobHardfork.js";
import { projectBaseFees } from "./projectBaseFees.js";
import { resolveBlobContext } from "./resolveBlobContext.js";
import { validateState } from "./validateState.js";
import { validateTxFeeParams } from "./validateTxFeeParams.js";
import { weiToGwei } from "./weiToGwei.js";
export { _nextState as nextState, BaseFee, BlobBaseFee, calculateBlobBaseFee, calculateBlobTxFee, calculateExcessBlobGas, calculateExcessBlobGasEip7918, calculateTxFee, canIncludeTx, getBlobSchedule, gweiToWei, isBlobForkAtLeastOsaka, normalizeBlobHardfork, projectBaseFees, resolveBlobContext, validateState, validateTxFeeParams, weiToGwei };
//# sourceMappingURL=FeeMarket.d.ts.map