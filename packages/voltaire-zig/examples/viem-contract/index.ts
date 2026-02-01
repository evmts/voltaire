/**
 * Viem Contract Abstraction - Copyable Implementation
 *
 * A viem-compatible contract abstraction built on Voltaire primitives.
 * Copy this entire directory into your codebase and customize as needed.
 *
 * @module examples/viem-contract
 */

// Main factory
export { getContract } from "./getContract.js";
export { getFunctionParameters, getEventParameters } from "./getContract.js";

// Standalone actions
export { readContract } from "./readContract.js";
export { writeContract } from "./writeContract.js";
export { simulateContract } from "./simulateContract.js";
export { estimateContractGas } from "./estimateContractGas.js";
export { watchContractEvent } from "./watchContractEvent.js";

// Errors
export {
	ContractError,
	ContractReadError,
	ContractWriteError,
	ContractSimulateError,
	ContractGasEstimationError,
	AccountNotFoundError,
	ContractFunctionNotFoundError,
	ContractEventNotFoundError,
	ContractEventWatchError,
} from "./errors.js";

// Types
export type {
	// Client types
	Client,
	Account,
	// Action parameters
	ReadContractParameters,
	ReadContractReturnType,
	WriteContractParameters,
	WriteContractReturnType,
	SimulateContractParameters,
	SimulateContractReturnType,
	EstimateContractGasParameters,
	EstimateContractGasReturnType,
	WatchContractEventParameters,
	WatchContractEventReturnType,
	WatchContractEventLog,
	// getContract types
	GetContractParameters,
	GetContractReturnType,
	ContractReadMethods,
	ContractWriteMethods,
	ContractSimulateMethods,
	ContractEstimateGasMethods,
	ContractWatchEventMethods,
	// Options
	ReadContractOptions,
	WriteContractOptions,
	SimulateContractOptions,
	EstimateGasOptions,
	WatchEventOptions,
	// ABI extraction types
	ExtractReadFunctions,
	ExtractWriteFunctions,
	ExtractEvents,
	GetFunction,
	GetEvent,
} from "./ViemContractTypes.js";
