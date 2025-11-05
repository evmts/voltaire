// @ts-nocheck
export * from "./constants.js";
export * from "./types.js";
import * as Precompile from "./Precompile.js";
export { Precompile };

import { calculateCallCost } from "./calculateCallCost.js";
import { calculateCopyCost } from "./calculateCopyCost.js";
import { calculateCreateCost } from "./calculateCreateCost.js";
import { calculateKeccak256Cost } from "./calculateKeccak256Cost.js";
import { calculateLogCost } from "./calculateLogCost.js";
import { calculateMaxRefund } from "./calculateMaxRefund.js";
import { calculateMemoryExpansionCost } from "./calculateMemoryExpansionCost.js";
import { calculateSstoreCost } from "./calculateSstoreCost.js";
import { calculateTxIntrinsicGas } from "./calculateTxIntrinsicGas.js";
import { callCost } from "./callCost.js";
import { copyCost } from "./copyCost.js";
import { createCost } from "./createCost.js";
import { getColdAccountAccessCost } from "./getColdAccountAccessCost.js";
import { getColdSloadCost } from "./getColdSloadCost.js";
import { getSelfdestructRefund } from "./getSelfdestructRefund.js";
import { getSstoreRefund } from "./getSstoreRefund.js";
import { hasEIP1153 } from "./hasEIP1153.js";
import { hasEIP2929 } from "./hasEIP2929.js";
import { hasEIP3529 } from "./hasEIP3529.js";
import { hasEIP3860 } from "./hasEIP3860.js";
import { hasEIP4844 } from "./hasEIP4844.js";
import { keccak256Cost } from "./keccak256Cost.js";
import { logCost } from "./logCost.js";
import { maxRefund } from "./maxRefund.js";
import { memoryExpansionCost } from "./memoryExpansionCost.js";
import { sstoreCost } from "./sstoreCost.js";
import { txIntrinsicGas } from "./txIntrinsicGas.js";

// Export individual functions
export {
	calculateKeccak256Cost,
	calculateSstoreCost,
	calculateLogCost,
	calculateCallCost,
	calculateMemoryExpansionCost,
	calculateCreateCost,
	calculateTxIntrinsicGas,
	calculateCopyCost,
	calculateMaxRefund,
	keccak256Cost,
	sstoreCost,
	logCost,
	callCost,
	memoryExpansionCost,
	createCost,
	txIntrinsicGas,
	copyCost,
	maxRefund,
	hasEIP2929,
	hasEIP3529,
	hasEIP3860,
	hasEIP1153,
	hasEIP4844,
	getColdSloadCost,
	getColdAccountAccessCost,
	getSstoreRefund,
	getSelfdestructRefund,
};

/**
 * @typedef {bigint} GasConstants
 */

/**
 * Factory function for gas cost calculations
 * Not needed for GasConstants as it's just a namespace of functions and constants
 */
export function GasConstants() {
	throw new Error("GasConstants is a namespace, not a constructor");
}

// Attach all functions and constants
GasConstants.calculateKeccak256Cost = calculateKeccak256Cost;
GasConstants.calculateSstoreCost = calculateSstoreCost;
GasConstants.calculateLogCost = calculateLogCost;
GasConstants.calculateCallCost = calculateCallCost;
GasConstants.calculateMemoryExpansionCost = calculateMemoryExpansionCost;
GasConstants.calculateCreateCost = calculateCreateCost;
GasConstants.calculateTxIntrinsicGas = calculateTxIntrinsicGas;
GasConstants.calculateCopyCost = calculateCopyCost;
GasConstants.calculateMaxRefund = calculateMaxRefund;
GasConstants.keccak256Cost = keccak256Cost;
GasConstants.sstoreCost = sstoreCost;
GasConstants.logCost = logCost;
GasConstants.callCost = callCost;
GasConstants.memoryExpansionCost = memoryExpansionCost;
GasConstants.createCost = createCost;
GasConstants.txIntrinsicGas = txIntrinsicGas;
GasConstants.copyCost = copyCost;
GasConstants.maxRefund = maxRefund;
GasConstants.hasEIP2929 = hasEIP2929;
GasConstants.hasEIP3529 = hasEIP3529;
GasConstants.hasEIP3860 = hasEIP3860;
GasConstants.hasEIP1153 = hasEIP1153;
GasConstants.hasEIP4844 = hasEIP4844;
GasConstants.getColdSloadCost = getColdSloadCost;
GasConstants.getColdAccountAccessCost = getColdAccountAccessCost;
GasConstants.getSstoreRefund = getSstoreRefund;
GasConstants.getSelfdestructRefund = getSelfdestructRefund;
GasConstants.Precompile = Precompile;
