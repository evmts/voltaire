/**
 * Multicall Module - Copyable Implementation
 *
 * Batch multiple contract read calls into a single RPC request
 * using the Multicall3 contract.
 *
 * This is a reference implementation - copy into your codebase
 * and customize as needed.
 *
 * @module examples/multicall
 *
 * @example
 * ```typescript
 * import { multicall, createMulticall } from './examples/multicall/index.js';
 * import type { TypedProvider } from './src/provider/TypedProvider.js';
 *
 * const erc20Abi = [
 *   {
 *     type: 'function',
 *     name: 'balanceOf',
 *     stateMutability: 'view',
 *     inputs: [{ type: 'address', name: 'account' }],
 *     outputs: [{ type: 'uint256', name: '' }],
 *   },
 *   {
 *     type: 'function',
 *     name: 'name',
 *     stateMutability: 'view',
 *     inputs: [],
 *     outputs: [{ type: 'string', name: '' }],
 *   },
 * ] as const;
 *
 * // Option 1: Direct call
 * const results = await multicall(provider, {
 *   contracts: [
 *     {
 *       address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *       abi: erc20Abi,
 *       functionName: 'name',
 *     },
 *     {
 *       address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *       abi: erc20Abi,
 *       functionName: 'balanceOf',
 *       args: ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e'],
 *     },
 *   ],
 * });
 *
 * // Option 2: Create bound function
 * const batchCall = createMulticall(provider);
 * const results2 = await batchCall({ contracts: [...] });
 * ```
 */

// Main exports
export { multicall, createMulticall } from "./multicall.js";

// ABI exports
export { multicall3Abi, aggregate3Abi } from "./Multicall3Abi.js";

// Contract address exports
export {
	MULTICALL3_ADDRESS,
	MULTICALL3_BYTECODE,
	multicall3Contracts,
	getMulticall3Contract,
	hasMulticall3,
} from "./contracts.js";

// Error exports
export {
	MulticallNotSupportedError,
	MulticallEncodingError,
	MulticallDecodingError,
	MulticallRpcError,
	MulticallContractError,
	MulticallZeroDataError,
	MulticallResultsMismatchError,
	MulticallAggregateError,
} from "./errors.js";

// Type exports
export type {
	BlockTag,
	ContractCall,
	MulticallParameters,
	MulticallSuccessResult,
	MulticallFailureResult,
	MulticallResult,
	MulticallReturnType,
	Aggregate3Call,
	Aggregate3Result,
	MulticallClientOptions,
	MulticallFunction,
} from "./MulticallTypes.js";
