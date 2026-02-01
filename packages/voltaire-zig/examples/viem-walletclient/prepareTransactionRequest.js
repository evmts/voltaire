/**
 * Prepare Transaction Request
 *
 * Prepares a transaction for signing by filling in missing fields.
 *
 * @module prepareTransactionRequest
 */

import { parseAccount } from "./createWalletClient.js";
import { getChainId } from "./getChainId.js";

/**
 * Default parameters to prepare
 * @type {string[]}
 */
export const defaultParameters = [
	"blobVersionedHashes",
	"chainId",
	"fees",
	"gas",
	"nonce",
	"type",
];

/**
 * Infer transaction type from fields
 *
 * @param {import('./WalletClientTypes.js').TransactionRequest} request
 * @returns {import('./WalletClientTypes.js').TransactionType}
 */
function getTransactionType(request) {
	if (request.authorizationList) return "eip7702";
	if (request.blobs || request.blobVersionedHashes || request.maxFeePerBlobGas)
		return "eip4844";
	if (request.maxFeePerGas || request.maxPriorityFeePerGas) return "eip1559";
	if (request.accessList) return "eip2930";
	if (request.gasPrice) return "legacy";
	// Default to EIP-1559 for modern networks
	return "eip1559";
}

/**
 * Get transaction count (nonce) for an address
 *
 * @param {import('./WalletClientTypes.js').Client} client
 * @param {Object} params
 * @param {string} params.address
 * @param {string} [params.blockTag]
 * @returns {Promise<number>}
 */
async function getTransactionCount(client, { address, blockTag = "pending" }) {
	const countHex = await client.request({
		method: "eth_getTransactionCount",
		params: [address, blockTag],
	});
	return Number.parseInt(countHex, 16);
}

/**
 * Estimate gas for a transaction
 *
 * @param {import('./WalletClientTypes.js').Client} client
 * @param {Object} request
 * @returns {Promise<bigint>}
 */
async function estimateGas(client, request) {
	const gasHex = await client.request({
		method: "eth_estimateGas",
		params: [formatRequestForEstimate(request)],
	});
	return BigInt(gasHex);
}

/**
 * Get gas price for legacy transactions
 *
 * @param {import('./WalletClientTypes.js').Client} client
 * @returns {Promise<bigint>}
 */
async function getGasPrice(client) {
	const gasPriceHex = await client.request({ method: "eth_gasPrice" });
	return BigInt(gasPriceHex);
}

/**
 * Get latest block for fee estimation
 *
 * @param {import('./WalletClientTypes.js').Client} client
 * @returns {Promise<Object>}
 */
async function getBlock(client) {
	return client.request({
		method: "eth_getBlockByNumber",
		params: ["latest", false],
	});
}

/**
 * Estimate fees per gas (EIP-1559)
 *
 * @param {import('./WalletClientTypes.js').Client} client
 * @param {Object} block
 * @returns {Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }>}
 */
async function estimateFeesPerGas(client, block) {
	const baseFeePerGas = block?.baseFeePerGas ? BigInt(block.baseFeePerGas) : 0n;

	// Get max priority fee (EIP-1559)
	let maxPriorityFeePerGas;
	try {
		const maxPriorityFeeHex = await client.request({
			method: "eth_maxPriorityFeePerGas",
		});
		maxPriorityFeePerGas = BigInt(maxPriorityFeeHex);
	} catch {
		// Fallback: use 1.5 gwei as default priority fee
		maxPriorityFeePerGas = 1_500_000_000n;
	}

	// maxFeePerGas = baseFeePerGas * 2 + maxPriorityFeePerGas
	const maxFeePerGas = baseFeePerGas * 2n + maxPriorityFeePerGas;

	return { maxFeePerGas, maxPriorityFeePerGas };
}

/**
 * Format request for gas estimation
 *
 * @param {Object} request
 * @returns {Object}
 */
function formatRequestForEstimate(request) {
	const formatted = {};
	if (request.from) formatted.from = request.from;
	if (request.to) formatted.to = request.to;
	if (request.data) formatted.data = request.data;
	if (request.value !== undefined)
		formatted.value = `0x${request.value.toString(16)}`;
	return formatted;
}

/**
 * Prepare a transaction request for signing
 *
 * Fills in missing fields like nonce, gas, fees, and chainId.
 *
 * @param {import('./WalletClientTypes.js').Client} client
 * @param {import('./WalletClientTypes.js').SendTransactionParameters} args
 * @returns {Promise<import('./WalletClientTypes.js').TransactionRequest>}
 *
 * @example
 * ```javascript
 * import { createWalletClient } from './createWalletClient.js';
 * import { privateKeyToAccount } from '../viem-account/index.js';
 *
 * const account = privateKeyToAccount('0x...');
 * const client = createWalletClient({
 *   account,
 *   chain: mainnet,
 *   transport: http(),
 * });
 *
 * const prepared = await client.prepareTransactionRequest({
 *   to: '0x...',
 *   value: 1000000000000000000n,
 * });
 * // { to: '0x...', value: 1n, gas: 21000n, nonce: 5, ... }
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: viem compatibility
export async function prepareTransactionRequest(client, args) {
	const {
		account: account_ = client.account,
		chain,
		gas,
		nonce,
		type,
		parameters = defaultParameters,
	} = args;

	const account = account_ ? parseAccount(account_) : undefined;
	const request = {
		...args,
		...(account ? { from: account.address } : {}),
	};

	// Get chainId if needed
	if (parameters.includes("chainId")) {
		if (chain) {
			request.chainId = chain.id;
		} else if (args.chainId === undefined) {
			request.chainId = await getChainId(client);
		}
	}

	// Get nonce if needed
	if (parameters.includes("nonce") && nonce === undefined && account) {
		if (account.nonceManager) {
			request.nonce = await account.nonceManager.consume({
				address: account.address,
				chainId: BigInt(request.chainId),
			});
		} else {
			request.nonce = await getTransactionCount(client, {
				address: account.address,
				blockTag: "pending",
			});
		}
	}

	// Determine transaction type if needed
	if (
		(parameters.includes("fees") || parameters.includes("type")) &&
		type === undefined
	) {
		request.type = getTransactionType(request);
	}

	// Get fees if needed
	if (parameters.includes("fees")) {
		const block = await getBlock(client);
		const isEip1559Network = block?.baseFeePerGas !== undefined;

		if (
			request.type !== "legacy" &&
			request.type !== "eip2930" &&
			isEip1559Network
		) {
			// EIP-1559 fees
			if (
				request.maxFeePerGas === undefined ||
				request.maxPriorityFeePerGas === undefined
			) {
				const fees = await estimateFeesPerGas(client, block);
				if (request.maxPriorityFeePerGas === undefined) {
					request.maxPriorityFeePerGas = fees.maxPriorityFeePerGas;
				}
				if (request.maxFeePerGas === undefined) {
					request.maxFeePerGas = fees.maxFeePerGas;
				}
			}
		} else {
			// Legacy fees
			if (request.gasPrice === undefined) {
				request.gasPrice = await getGasPrice(client);
			}
		}
	}

	// Estimate gas if needed
	if (parameters.includes("gas") && gas === undefined) {
		request.gas = await estimateGas(client, request);
	}

	// Clean up
	request.parameters = undefined;

	return request;
}

/**
 * Factory: Create prepareTransactionRequest with custom dependencies
 *
 * @param {Object} deps
 * @param {Function} deps.parseAccount
 * @param {Function} deps.getChainId
 * @returns {Function}
 */
export function PrepareTransactionRequest({
	parseAccount: parseAccountFn,
	getChainId: getChainIdFn,
}) {
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: viem compatibility
	return async function prepareTransactionRequest(client, args) {
		const {
			account: account_ = client.account,
			chain,
			gas,
			nonce,
			type,
			parameters = defaultParameters,
		} = args;

		const account = account_ ? parseAccountFn(account_) : undefined;
		const request = { ...args, ...(account ? { from: account.address } : {}) };

		if (parameters.includes("chainId")) {
			if (chain) {
				request.chainId = chain.id;
			} else if (args.chainId === undefined) {
				request.chainId = await getChainIdFn(client);
			}
		}

		if (parameters.includes("nonce") && nonce === undefined && account) {
			if (account.nonceManager) {
				request.nonce = await account.nonceManager.consume({
					address: account.address,
					chainId: BigInt(request.chainId),
				});
			} else {
				request.nonce = await getTransactionCount(client, {
					address: account.address,
					blockTag: "pending",
				});
			}
		}

		if (
			(parameters.includes("fees") || parameters.includes("type")) &&
			type === undefined
		) {
			request.type = getTransactionType(request);
		}

		if (parameters.includes("fees")) {
			const block = await getBlock(client);
			const isEip1559Network = block?.baseFeePerGas !== undefined;

			if (
				request.type !== "legacy" &&
				request.type !== "eip2930" &&
				isEip1559Network
			) {
				if (
					request.maxFeePerGas === undefined ||
					request.maxPriorityFeePerGas === undefined
				) {
					const fees = await estimateFeesPerGas(client, block);
					if (request.maxPriorityFeePerGas === undefined) {
						request.maxPriorityFeePerGas = fees.maxPriorityFeePerGas;
					}
					if (request.maxFeePerGas === undefined) {
						request.maxFeePerGas = fees.maxFeePerGas;
					}
				}
			} else {
				if (request.gasPrice === undefined) {
					request.gasPrice = await getGasPrice(client);
				}
			}
		}

		if (parameters.includes("gas") && gas === undefined) {
			request.gas = await estimateGas(client, request);
		}

		request.parameters = undefined;

		return request;
	};
}

export default prepareTransactionRequest;
