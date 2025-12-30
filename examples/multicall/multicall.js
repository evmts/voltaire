/**
 * Multicall Implementation
 *
 * Batch multiple contract read calls into a single RPC request
 * using the Multicall3 contract.
 *
 * @module examples/multicall/multicall
 */

import { Abi } from "../../src/primitives/Abi/Abi.js";
import * as Hex from "../../src/primitives/Hex/index.js";
import { aggregate3Abi } from "./Multicall3Abi.js";
import { MULTICALL3_ADDRESS, MULTICALL3_BYTECODE } from "./contracts.js";
import {
	MulticallContractError,
	MulticallDecodingError,
	MulticallEncodingError,
	MulticallNotSupportedError,
	MulticallResultsMismatchError,
	MulticallRpcError,
	MulticallZeroDataError,
} from "./errors.js";

/**
 * @typedef {import('./MulticallTypes.js').ContractCall} ContractCall
 * @typedef {import('./MulticallTypes.js').MulticallParameters} MulticallParameters
 * @typedef {import('./MulticallTypes.js').Aggregate3Call} Aggregate3Call
 * @typedef {import('./MulticallTypes.js').Aggregate3Result} Aggregate3Result
 * @typedef {import('../../src/provider/TypedProvider.js').TypedProvider} TypedProvider
 */

/**
 * Batch multiple contract read calls into a single RPC request.
 *
 * Uses the Multicall3 contract to aggregate calls and return results
 * in a single eth_call. Supports per-call failure handling.
 *
 * @template {readonly import('./MulticallTypes.js').ContractCall[]} TContracts
 * @template {boolean} [TAllowFailure=true]
 * @param {TypedProvider} provider - EIP-1193 provider
 * @param {import('./MulticallTypes.js').MulticallParameters<TContracts, TAllowFailure>} parameters - Multicall parameters
 * @returns {Promise<import('./MulticallTypes.js').MulticallReturnType<TContracts, TAllowFailure>>} Array of results
 *
 * @example
 * ```typescript
 * const erc20Abi = [...] as const;
 *
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
 * // With allowFailure: true (default)
 * // results[0] = { status: 'success', result: 'USD Coin' }
 * // results[1] = { status: 'success', result: 1000000n }
 *
 * // With allowFailure: false
 * // results[0] = 'USD Coin'
 * // results[1] = 1000000n
 * // Throws if any call fails
 * ```
 */
export async function multicall(provider, parameters) {
	const {
		contracts,
		allowFailure = true,
		blockNumber,
		blockTag,
		multicallAddress = MULTICALL3_ADDRESS,
		batchSize = 1024,
		deployless = false,
	} = parameters;

	// Build Multicall3 ABI instance for encoding/decoding
	const multicall3 = Abi(aggregate3Abi);

	// Encode all calls and split into chunks
	const { chunks, encodingErrors } = encodeContractCalls(
		contracts,
		batchSize,
		allowFailure,
	);

	// If not allowing failure and there were encoding errors, throw
	if (!allowFailure && encodingErrors.length > 0) {
		throw encodingErrors[0].error;
	}

	// Execute all chunks in parallel
	const chunkResults = await executeChunks(
		provider,
		multicall3,
		chunks,
		multicallAddress,
		blockNumber,
		blockTag,
		deployless,
		allowFailure,
	);

	// Decode results and build final array
	const results = decodeResults(
		contracts,
		chunks,
		chunkResults,
		encodingErrors,
		allowFailure,
	);

	// Verify results count
	if (results.length !== contracts.length) {
		throw new MulticallResultsMismatchError(contracts.length, results.length);
	}

	return /** @type {*} */ (results);
}

/**
 * Encode contract calls into Multicall3 call structs
 *
 * @param {readonly ContractCall[]} contracts - Contract calls to encode
 * @param {number} batchSize - Max calldata bytes per batch
 * @param {boolean} allowFailure - Whether to allow encoding failures
 * @returns {{ chunks: Aggregate3Call[][]; encodingErrors: Array<{ index: number; error: Error }> }}
 */
function encodeContractCalls(contracts, batchSize, allowFailure) {
	/** @type {Aggregate3Call[][]} */
	const chunks = [[]];
	/** @type {Array<{ index: number; error: Error }>} */
	const encodingErrors = [];

	let currentChunk = 0;
	let currentChunkSize = 0;

	for (let i = 0; i < contracts.length; i++) {
		const contract = contracts[i];
		const { address, abi, functionName, args = [] } = contract;

		try {
			// Build ABI instance and encode function call
			const abiInstance = Abi(/** @type {*} */ (abi));
			const callData = abiInstance.encode(functionName, args);
			const callDataHex = /** @type {`0x${string}`} */ (Hex.fromBytes(callData));

			// Calculate calldata size (remove 0x prefix, divide by 2 for bytes)
			const callDataSize = (callDataHex.length - 2) / 2;
			currentChunkSize += callDataSize;

			// Check if we need a new chunk
			if (
				batchSize > 0 &&
				currentChunkSize > batchSize &&
				chunks[currentChunk].length > 0
			) {
				currentChunk++;
				currentChunkSize = callDataSize;
				chunks[currentChunk] = [];
			}

			// Add call to current chunk
			chunks[currentChunk].push({
				target: /** @type {`0x${string}`} */ (address),
				allowFailure: true, // Always allow failure in Multicall3, we handle it ourselves
				callData: callDataHex,
			});
		} catch (err) {
			const error = new MulticallEncodingError(i, functionName, err);
			encodingErrors.push({ index: i, error });

			if (allowFailure) {
				// Add placeholder call that will definitely fail
				chunks[currentChunk].push({
					target: /** @type {`0x${string}`} */ (address),
					allowFailure: true,
					callData: "0x",
				});
			}
		}
	}

	return { chunks, encodingErrors };
}

/**
 * Execute multicall chunks via RPC
 *
 * @param {TypedProvider} provider - Provider
 * @param {ReturnType<typeof Abi>} multicall3 - Multicall3 ABI instance
 * @param {Aggregate3Call[][]} chunks - Call chunks
 * @param {string} multicallAddress - Multicall3 address
 * @param {bigint | undefined} blockNumber - Block number
 * @param {string | undefined} blockTag - Block tag
 * @param {boolean} deployless - Use deployless mode
 * @param {boolean} allowFailure - Allow failures
 * @returns {Promise<PromiseSettledResult<Aggregate3Result[]>[]>}
 */
async function executeChunks(
	provider,
	multicall3,
	chunks,
	multicallAddress,
	blockNumber,
	blockTag,
	deployless,
	allowFailure,
) {
	const blockParam = blockNumber
		? `0x${blockNumber.toString(16)}`
		: blockTag ?? "latest";

	const promises = chunks.map(async (calls, chunkIndex) => {
		try {
			// Convert calls from objects to arrays for Voltaire ABI encoding
			// Voltaire expects tuples as [target, allowFailure, callData] arrays
			const callsAsArrays = calls.map((call) => [
				call.target,
				call.allowFailure,
				call.callData,
			]);

			// Encode aggregate3 call
			const callData = multicall3.encode("aggregate3", [callsAsArrays]);
			const callDataHex = /** @type {`0x${string}`} */ (Hex.fromBytes(callData));

			// Build call params
			const callParams = deployless
				? { code: MULTICALL3_BYTECODE, data: callDataHex }
				: { to: multicallAddress, data: callDataHex };

			// Execute eth_call
			const resultHex = await provider.request({
				method: "eth_call",
				params: [callParams, blockParam],
			});

			// Decode aggregate3 result
			const decoded = multicall3.decode("aggregate3", Hex.toBytes(resultHex));
			return /** @type {Aggregate3Result[]} */ (decoded[0]);
		} catch (err) {
			throw new MulticallRpcError(chunkIndex, err);
		}
	});

	return Promise.allSettled(promises);
}

/**
 * Decode results from executed chunks
 *
 * @param {readonly ContractCall[]} contracts - Original contracts
 * @param {Aggregate3Call[][]} chunks - Call chunks
 * @param {PromiseSettledResult<Aggregate3Result[]>[]} chunkResults - Chunk execution results
 * @param {Array<{ index: number; error: Error }>} encodingErrors - Encoding errors
 * @param {boolean} allowFailure - Allow failures
 * @returns {Array<{ status: string; result?: unknown; error?: Error } | unknown>}
 */
function decodeResults(
	contracts,
	chunks,
	chunkResults,
	encodingErrors,
	allowFailure,
) {
	/** @type {Array<{ status: string; result?: unknown; error?: Error } | unknown>} */
	const results = [];

	// Build map of encoding errors by index
	const encodingErrorMap = new Map(encodingErrors.map((e) => [e.index, e.error]));

	let contractIndex = 0;

	for (let chunkIndex = 0; chunkIndex < chunkResults.length; chunkIndex++) {
		const chunkResult = chunkResults[chunkIndex];
		const chunk = chunks[chunkIndex];

		// Handle chunk-level failure
		if (chunkResult.status === "rejected") {
			if (!allowFailure) {
				throw chunkResult.reason;
			}

			// Mark all calls in this chunk as failed
			for (let j = 0; j < chunk.length; j++) {
				results.push({
					status: "failure",
					error: chunkResult.reason,
					result: undefined,
				});
				contractIndex++;
			}
			continue;
		}

		// Process individual results
		const aggregate3Results = chunkResult.value;

		for (let j = 0; j < aggregate3Results.length; j++) {
			const { success, returnData } = aggregate3Results[j];
			const contract = contracts[contractIndex];
			const { callData } = chunk[j];

			// Check for encoding error (placeholder call)
			const encodingError = encodingErrorMap.get(contractIndex);
			if (encodingError) {
				if (!allowFailure) {
					throw encodingError;
				}
				results.push({
					status: "failure",
					error: encodingError,
					result: undefined,
				});
				contractIndex++;
				continue;
			}

			// Check for empty calldata (encoding failed)
			if (callData === "0x") {
				const error = new MulticallZeroDataError(
					contractIndex,
					contract.functionName,
					contract.address,
				);
				if (!allowFailure) {
					throw error;
				}
				results.push({
					status: "failure",
					error,
					result: undefined,
				});
				contractIndex++;
				continue;
			}

			// Check for call failure
			if (!success) {
				const error = new MulticallContractError(
					contractIndex,
					contract.functionName,
					contract.address,
					returnData,
				);
				if (!allowFailure) {
					throw error;
				}
				results.push({
					status: "failure",
					error,
					result: undefined,
				});
				contractIndex++;
				continue;
			}

			// Check for empty return data
			if (returnData === "0x" || returnData === "") {
				const error = new MulticallZeroDataError(
					contractIndex,
					contract.functionName,
					contract.address,
				);
				if (!allowFailure) {
					throw error;
				}
				results.push({
					status: "failure",
					error,
					result: undefined,
				});
				contractIndex++;
				continue;
			}

			// Decode result
			try {
				const abiInstance = Abi(/** @type {*} */ (contract.abi));
				const decoded = abiInstance.decode(
					contract.functionName,
					Hex.toBytes(returnData),
				);

				// Unwrap single output
				const result = decoded.length === 1 ? decoded[0] : decoded;

				if (allowFailure) {
					results.push({ status: "success", result });
				} else {
					results.push(result);
				}
			} catch (err) {
				const error = new MulticallDecodingError(
					contractIndex,
					contract.functionName,
					err,
				);
				if (!allowFailure) {
					throw error;
				}
				results.push({
					status: "failure",
					error,
					result: undefined,
				});
			}

			contractIndex++;
		}
	}

	return results;
}

/**
 * Create a multicall function bound to a provider
 *
 * @param {TypedProvider} provider - EIP-1193 provider
 * @param {object} [options] - Default options
 * @param {`0x${string}`} [options.multicallAddress] - Default Multicall3 address
 * @param {number} [options.batchSize] - Default batch size
 * @returns {<TContracts extends readonly ContractCall[], TAllowFailure extends boolean = true>(params: Omit<import('./MulticallTypes.js').MulticallParameters<TContracts, TAllowFailure>, 'provider'>) => Promise<import('./MulticallTypes.js').MulticallReturnType<TContracts, TAllowFailure>>}
 *
 * @example
 * ```typescript
 * const batchCall = createMulticall(provider, { batchSize: 2048 });
 *
 * const results = await batchCall({
 *   contracts: [...],
 * });
 * ```
 */
export function createMulticall(provider, options = {}) {
	return (params) =>
		multicall(provider, {
			...options,
			...params,
		});
}
