/**
 * @fileoverview Provider module exports for read-only blockchain operations.
 *
 * @module Provider
 * @since 0.0.1
 */

// Re-export block streaming types for convenience
export type {
	BackfillOptions,
	BlockInclude,
	BlockStreamEvent,
	BlocksEvent,
	WatchOptions,
} from "@tevm/voltaire/block";

// Free functions (all blockchain operations)
export * from "./functions/index.js";

// Types and errors
export * from "./types.js";

// Service and layer
export { ProviderService, type ProviderShape } from "./ProviderService.js";
export { Provider } from "./Provider.js";

// Convenience provider factories (idiomatic - use these instead of Provider + Transport)
export {
	HttpProvider,
	HttpProviderFetch,
	WebSocketProvider,
	WebSocketProviderGlobal,
	type WebSocketProviderConfig,
	BrowserProvider,
	IpcProvider,
	TestProvider,
} from "./providers.js";

// Contract actions
export {
	type ContractCall,
	type MulticallError,
	type MulticallParams,
	type MulticallResults,
	multicall,
	type SimulateContractError,
	type SimulateContractParams,
	type SimulateContractResult,
	type StateOverride,
	simulateContract,
	type Abi,
	type ReadContractError,
	type ReadContractParams,
	readContract,
} from "./actions/index.js";

// Simulate calls
export {
	type AssetChange,
	type SimulateCallsError,
	type SimulateCallsParams,
	type SimulationResult,
	simulateCalls,
} from "./simulateCalls.js";

// Utils
export {
	bytesToHex,
	formatAccessList,
	formatCallRequest,
	formatLogFilterParams,
	formatTransactionRequest,
	parseHexToBigInt,
	toAddressHex,
	toHashHex,
} from "./utils.js";
