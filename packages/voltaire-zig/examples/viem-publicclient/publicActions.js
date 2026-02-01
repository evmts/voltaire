/**
 * Public Actions Decorator
 *
 * Binds public actions to a client instance.
 *
 * @module examples/viem-publicclient/publicActions
 */

import { call } from "./actions/call.js";
import { estimateGas } from "./actions/estimateGas.js";
import { getBalance } from "./actions/getBalance.js";
import { getBlock } from "./actions/getBlock.js";
import { getBlockNumber } from "./actions/getBlockNumber.js";
import { getChainId } from "./actions/getChainId.js";
import { getCode } from "./actions/getCode.js";
import { getGasPrice } from "./actions/getGasPrice.js";
import { getLogs } from "./actions/getLogs.js";
import { getStorageAt } from "./actions/getStorageAt.js";
import { getTransaction } from "./actions/getTransaction.js";
import { getTransactionCount } from "./actions/getTransactionCount.js";
import { getTransactionReceipt } from "./actions/getTransactionReceipt.js";
import { simulateContract } from "./actions/simulateContract.js";

/**
 * @typedef {import('./PublicClientType.js').Client} Client
 * @typedef {import('./PublicClientType.js').PublicActions} PublicActions
 */

/**
 * Create public actions bound to client
 *
 * @param {Client} client - Client instance
 * @returns {PublicActions} Public actions
 */
export function publicActions(client) {
	return {
		getBlockNumber: (args) => getBlockNumber(client, args),
		getBalance: (args) => getBalance(client, args),
		getChainId: () => getChainId(client),
		call: (args) => call(client, args),
		getBlock: (args) => getBlock(client, args),
		estimateGas: (args) => estimateGas(client, args),
		getTransaction: (args) => getTransaction(client, args),
		getTransactionReceipt: (args) => getTransactionReceipt(client, args),
		getLogs: (args) => getLogs(client, args),
		getCode: (args) => getCode(client, args),
		getStorageAt: (args) => getStorageAt(client, args),
		getTransactionCount: (args) => getTransactionCount(client, args),
		getGasPrice: () => getGasPrice(client),
		simulateContract: (args) => simulateContract(client, args),
	};
}
