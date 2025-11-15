// Import all functions
import { BaseFee } from "./BaseFee.js";
import { BlobBaseFee } from "./BlobBaseFee.js";
import { calculateBlobTxFee } from "./calculateBlobTxFee.js";
import { calculateExcessBlobGas } from "./calculateExcessBlobGas.js";
import { calculateTxFee } from "./calculateTxFee.js";
import { canIncludeTx } from "./canIncludeTx.js";
import { getBlobBaseFee } from "./getBlobBaseFee.js";
import { getGasTarget } from "./getGasTarget.js";
import { gweiToWei } from "./gweiToWei.js";
import { isAboveBlobGasTarget } from "./isAboveBlobGasTarget.js";
import { isAboveGasTarget } from "./isAboveGasTarget.js";
import { nextState } from "./nextState.js";
import { projectBaseFees } from "./projectBaseFees.js";
import { validateState } from "./validateState.js";
import { validateTxFeeParams } from "./validateTxFeeParams.js";
import { weiToGwei } from "./weiToGwei.js";

// Export individual functions (public API)
export {
	BaseFee,
	BlobBaseFee,
	calculateBlobTxFee,
	calculateExcessBlobGas,
	calculateTxFee,
	canIncludeTx,
	getBlobBaseFee,
	getGasTarget,
	gweiToWei,
	isAboveBlobGasTarget,
	isAboveGasTarget,
	nextState,
	projectBaseFees,
	validateState,
	validateTxFeeParams,
	weiToGwei,
};

// Export internal functions (tree-shakeable)
export {
	BaseFee as _BaseFee,
	BlobBaseFee as _BlobBaseFee,
	calculateBlobTxFee as _calculateBlobTxFee,
	calculateExcessBlobGas as _calculateExcessBlobGas,
	calculateTxFee as _calculateTxFee,
	canIncludeTx as _canIncludeTx,
	getBlobBaseFee as _getBlobBaseFee,
	getGasTarget as _getGasTarget,
	gweiToWei as _gweiToWei,
	isAboveBlobGasTarget as _isAboveBlobGasTarget,
	isAboveGasTarget as _isAboveGasTarget,
	nextState as _nextState,
	projectBaseFees as _projectBaseFees,
	validateState as _validateState,
	validateTxFeeParams as _validateTxFeeParams,
	weiToGwei as _weiToGwei,
};

// Namespace export
export const BrandedFeeMarket = {
	BaseFee,
	BlobBaseFee,
	calculateBlobTxFee,
	calculateExcessBlobGas,
	calculateTxFee,
	canIncludeTx,
	getBlobBaseFee,
	getGasTarget,
	gweiToWei,
	isAboveBlobGasTarget,
	isAboveGasTarget,
	nextState,
	projectBaseFees,
	validateState,
	validateTxFeeParams,
	weiToGwei,
};
