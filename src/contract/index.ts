/**
 * Contract Module
 *
 * Typed contract abstraction for interacting with deployed smart contracts.
 *
 * @example
 * ```typescript
 * import { Contract } from '@voltaire/contract';
 *
 * const usdc = Contract({
 *   address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *   abi: erc20Abi,
 *   provider
 * });
 *
 * const balance = await usdc.read.balanceOf('0x...');
 * const txHash = await usdc.write.transfer('0x...', 1000n);
 *
 * for await (const log of usdc.events.Transfer()) {
 *   console.log(log.args);
 * }
 * ```
 *
 * @module contract
 */

// Main factories
export { Contract } from "./Contract.js";
export { EventStream } from "./EventStream.js";

// Types
export type {
	ContractInstance,
	ContractOptions,
	ContractReadMethods,
	ContractWriteMethods,
	ContractEstimateGasMethods,
	ContractEventFilters,
	DecodedEventLog,
	EventFilterOptions,
	ExtractReadFunctions,
	ExtractWriteFunctions,
	ExtractEvents,
	GetFunction,
	GetEvent,
} from "./ContractType.js";

// EventStream types
export type {
	EventStream as EventStreamInstance,
	EventStreamConstructorOptions,
	EventStreamOptions,
	BackfillOptions,
	WatchOptions,
	EventStreamResult,
	EventStreamMetadata,
	RetryOptions,
} from "./EventStreamType.js";

// Errors
export {
	ContractNotImplementedError,
	ContractFunctionNotFoundError,
	ContractEventNotFoundError,
	ContractReadError,
	ContractWriteError,
	BlockRangeTooLargeError,
	EventStreamAbortedError,
} from "./errors.js";
