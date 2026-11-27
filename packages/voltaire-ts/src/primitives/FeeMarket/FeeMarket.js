/**
 * Fee Market Types and Utilities
 *
 * EIP-1559 & EIP-4844 fee market calculations with type-safe operations.
 *
 * @example
 * ```typescript
 * import * as FeeMarket from './FeeMarket.js';
 *
 * // Calculate next base fee (EIP-1559)
 * const nextBaseFee = FeeMarket.BaseFee(
 *   30_000_000n, // parent gas used
 *   30_000_000n, // parent gas limit
 *   1_000_000_000n // parent base fee (1 gwei)
 * );
 *
 * // Calculate blob base fee (EIP-4844)
 * const blobBaseFee = FeeMarket.BlobBaseFee(393216n);
 * ```
 */

export * from "./BlobScheduleType.js";
export * from "./BlobTxFee.js";
export * from "./BlobTxFeeParams.js";
export * from "./BrandedState.js";
export * from "./Eip1559State.js";
export * from "./Eip4844State.js";
// Export branded types
export * from "./FeeMarketType.js";
export * from "./State.js";
export * from "./TxFee.js";
export * from "./TxFeeParams.js";

// Export constants
import * as BlobScheduleConstants from "./blobSchedule.js";
import * as Eip1559Constants from "./eip1559Constants.js";
import * as Eip4844Constants from "./eip4844Constants.js";
import {
	blobScheduleForHardfork,
	blobScheduleForTimestamp,
	getBlobSchedule,
} from "./getBlobSchedule.js";

export const Eip1559 = Eip1559Constants;
export const Eip4844 = Eip4844Constants;
/**
 * Blob schedule presets (CANCUN, PRAGUE, OSAKA, BPO1, BPO2), mainnet
 * activation timestamps, EIP-7918 constants, and lookup helpers.
 */
export const BlobSchedule = Object.freeze({
	...BlobScheduleConstants,
	forHardfork: blobScheduleForHardfork,
	forTimestamp: blobScheduleForTimestamp,
});

// Import methods
import { BaseFee } from "./BaseFee.js";
import { BlobBaseFee } from "./BlobBaseFee.js";
import { calculateBlobBaseFee } from "./calculateBlobBaseFee.js";
import { calculateBlobTxFee } from "./calculateBlobTxFee.js";
import {
	calculateExcessBlobGas,
	calculateExcessBlobGasEip7918,
} from "./calculateExcessBlobGas.js";
import { calculateTxFee } from "./calculateTxFee.js";
import { canIncludeTx } from "./canIncludeTx.js";
import { getBlobBaseFee as _getBlobBaseFee } from "./getBlobBaseFee.js";
import { getGasTarget as _getGasTarget } from "./getGasTarget.js";
import { gweiToWei } from "./gweiToWei.js";
import { isAboveBlobGasTarget as _isAboveBlobGasTarget } from "./isAboveBlobGasTarget.js";
import { isAboveGasTarget as _isAboveGasTarget } from "./isAboveGasTarget.js";
import { nextState as _nextState } from "./nextState.js";
import {
	isBlobForkAtLeastOsaka,
	normalizeBlobHardfork,
} from "./normalizeBlobHardfork.js";
import { projectBaseFees } from "./projectBaseFees.js";
import { resolveBlobContext } from "./resolveBlobContext.js";
import { validateState } from "./validateState.js";
import { validateTxFeeParams } from "./validateTxFeeParams.js";
import { weiToGwei } from "./weiToGwei.js";

// Export individual functions
export {
	_nextState as nextState,
	BaseFee,
	BlobBaseFee,
	calculateBlobBaseFee,
	calculateBlobTxFee,
	calculateExcessBlobGas,
	calculateExcessBlobGasEip7918,
	calculateTxFee,
	canIncludeTx,
	getBlobSchedule,
	gweiToWei,
	isBlobForkAtLeastOsaka,
	normalizeBlobHardfork,
	projectBaseFees,
	resolveBlobContext,
	validateState,
	validateTxFeeParams,
	weiToGwei,
};

/**
 * @typedef {import('./FeeMarketType.js').FeeMarketType} State
 */

/**
 * State namespace with convenience methods
 */
export const State = {
	/**
	 * Calculate next block's fee market state
	 * @type {(this: State, context?: import('./BlobScheduleType.js').BlobForkContext) => State}
	 */
	next: function (context) {
		return _nextState(this, context);
	},

	/**
	 * Get current blob base fee
	 * @type {(this: State, context?: import('./BlobScheduleType.js').BlobForkContext) => bigint}
	 */
	getBlobBaseFee: function (context) {
		return _getBlobBaseFee(this, context);
	},

	/**
	 * Get gas target for block
	 * @type {(this: State) => bigint}
	 */
	getGasTarget: function () {
		return _getGasTarget(this);
	},

	/**
	 * Check if block is above gas target
	 * @type {(this: State) => boolean}
	 */
	isAboveGasTarget: function () {
		return _isAboveGasTarget(this);
	},

	/**
	 * Check if block is above blob gas target
	 * @type {(this: State, context?: import('./BlobScheduleType.js').BlobForkContext) => boolean}
	 */
	isAboveBlobGasTarget: function (context) {
		return _isAboveBlobGasTarget(this, context);
	},
};
