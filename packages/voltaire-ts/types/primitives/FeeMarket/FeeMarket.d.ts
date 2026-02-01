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
export type State = import("./FeeMarketType.js").FeeMarketType;
export namespace State {
    let next: (this: State) => State;
    let getBlobBaseFee: (this: State) => bigint;
    let getGasTarget: (this: State) => bigint;
    let isAboveGasTarget: (this: State) => boolean;
    let isAboveBlobGasTarget: (this: State) => boolean;
}
import * as Eip1559Constants from "./eip1559Constants.js";
import * as Eip4844Constants from "./eip4844Constants.js";
import { BaseFee } from "./BaseFee.js";
import { BlobBaseFee } from "./BlobBaseFee.js";
import { calculateExcessBlobGas } from "./calculateExcessBlobGas.js";
import { calculateTxFee } from "./calculateTxFee.js";
import { calculateBlobTxFee } from "./calculateBlobTxFee.js";
import { canIncludeTx } from "./canIncludeTx.js";
import { nextState as _nextState } from "./nextState.js";
import { projectBaseFees } from "./projectBaseFees.js";
import { validateTxFeeParams } from "./validateTxFeeParams.js";
import { validateState } from "./validateState.js";
import { weiToGwei } from "./weiToGwei.js";
import { gweiToWei } from "./gweiToWei.js";
export { BaseFee, BlobBaseFee, calculateExcessBlobGas, calculateTxFee, calculateBlobTxFee, canIncludeTx, _nextState as nextState, projectBaseFees, validateTxFeeParams, validateState, weiToGwei, gweiToWei };
//# sourceMappingURL=FeeMarket.d.ts.map