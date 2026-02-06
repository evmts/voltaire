/**
 * @fileoverview GasConstants module providing EVM operation gas costs.
 *
 * @description
 * Gas constants define the computational cost of each EVM operation as
 * specified in the Ethereum Yellow Paper. These values are used for gas
 * calculation during transaction execution and simulation.
 *
 * Categories:
 * - Tier costs: GAS_ZERO, GAS_BASE, GAS_VERYLOW, GAS_LOW, GAS_MID, GAS_HIGH
 * - Storage: GAS_SSET, GAS_SRESET, GAS_SCLEAR
 * - Memory: GAS_MEMORY, GAS_COPY, GAS_KECCAK256
 * - Transaction: GAS_TRANSACTION, GAS_TXDATAZERO, GAS_TXDATANONZERO
 * - Contract: GAS_CREATE, GAS_CODEDEPOSIT
 *
 * @module GasConstants
 * @since 0.0.1
 * @see {@link GasCosts} for comprehensive cost tables
 * @see {@link Gas} for gas values
 */

export {
	calculateCallCost,
	calculateCopyCost,
	calculateCreateCost,
	calculateKeccak256Cost,
	calculateLogCost,
	calculateMaxRefund,
	calculateMemoryExpansionCost,
	calculateSstoreCost,
	calculateTxIntrinsicGas,
} from "@tevm/voltaire/GasConstants";
export * from "./GasConstantsSchema.js";
