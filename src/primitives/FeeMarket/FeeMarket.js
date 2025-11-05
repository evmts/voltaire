// @ts-nocheck

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
 * const nextBaseFee = FeeMarket.calculateBaseFee(
 *   30_000_000n, // parent gas used
 *   30_000_000n, // parent gas limit
 *   1_000_000_000n // parent base fee (1 gwei)
 * );
 *
 * // Calculate blob base fee (EIP-4844)
 * const blobBaseFee = FeeMarket.calculateBlobBaseFee(393216n);
 * ```
 */

// Export branded types
export * from "./BrandedState.js";
export * from "./State.js";
export * from "./Eip1559State.js";
export * from "./Eip4844State.js";
export * from "./TxFeeParams.js";
export * from "./BlobTxFeeParams.js";
export * from "./TxFee.js";
export * from "./BlobTxFee.js";

// Export constants
import * as Eip1559Constants from "./eip1559Constants.js";
import * as Eip4844Constants from "./eip4844Constants.js";

export const Eip1559 = Eip1559Constants;
export const Eip4844 = Eip4844Constants;

// Import methods
import { calculateBaseFee } from "./BrandedFeeMarket/calculateBaseFee.js";
import { calculateBlobBaseFee } from "./BrandedFeeMarket/calculateBlobBaseFee.js";
import { calculateBlobTxFee } from "./BrandedFeeMarket/calculateBlobTxFee.js";
import { calculateExcessBlobGas } from "./BrandedFeeMarket/calculateExcessBlobGas.js";
import { calculateTxFee } from "./BrandedFeeMarket/calculateTxFee.js";
import { canIncludeTx } from "./BrandedFeeMarket/canIncludeTx.js";
import { getBlobBaseFee as _getBlobBaseFee } from "./BrandedFeeMarket/getBlobBaseFee.js";
import { getGasTarget as _getGasTarget } from "./BrandedFeeMarket/getGasTarget.js";
import { gweiToWei } from "./BrandedFeeMarket/gweiToWei.js";
import { isAboveBlobGasTarget as _isAboveBlobGasTarget } from "./BrandedFeeMarket/isAboveBlobGasTarget.js";
import { isAboveGasTarget as _isAboveGasTarget } from "./BrandedFeeMarket/isAboveGasTarget.js";
import { nextState as _nextState } from "./BrandedFeeMarket/nextState.js";
import { projectBaseFees } from "./BrandedFeeMarket/projectBaseFees.js";
import { validateState } from "./BrandedFeeMarket/validateState.js";
import { validateTxFeeParams } from "./BrandedFeeMarket/validateTxFeeParams.js";
import { weiToGwei } from "./BrandedFeeMarket/weiToGwei.js";

// Export individual functions
export {
	calculateBaseFee,
	calculateBlobBaseFee,
	calculateExcessBlobGas,
	calculateTxFee,
	calculateBlobTxFee,
	canIncludeTx,
	_nextState as nextState,
	projectBaseFees,
	validateTxFeeParams,
	validateState,
	weiToGwei,
	gweiToWei,
};

/**
 * @typedef {import('./BrandedState.js').BrandedState} State
 */

/**
 * State namespace with convenience methods
 */
export const State = {
	/**
	 * Calculate next block's fee market state
	 * @type {(this: State) => State}
	 */
	next: function () {
		return _nextState(this);
	},

	/**
	 * Get current blob base fee
	 * @type {(this: State) => bigint}
	 */
	getBlobBaseFee: function () {
		return _getBlobBaseFee(this);
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
	 * @type {(this: State) => boolean}
	 */
	isAboveBlobGasTarget: function () {
		return _isAboveBlobGasTarget(this);
	},
};
