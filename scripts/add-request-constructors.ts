#!/usr/bin/env bun
/**
 * Add Request constructor functions to all eth JSON-RPC method files
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ETH_DIR = "/Users/williamcory/voltaire/src/jsonrpc/eth";

interface MethodConfig {
	name: string;
	params: string[];
	requestName: string;
	hasDefaultParams?: boolean;
}

// Method configurations with their parameter signatures
const methodConfigs: Record<string, MethodConfig> = {
	accounts: {
		name: "eth_accounts",
		params: [],
		requestName: "AccountsRequest",
	},
	blobBaseFee: {
		name: "eth_blobBaseFee",
		params: [],
		requestName: "BlobBaseFeeRequest",
	},
	blockNumber: {
		name: "eth_blockNumber",
		params: [],
		requestName: "BlockNumberRequest",
	},
	call: {
		name: "eth_call",
		params: ["CallParams", "BlockSpec"],
		requestName: "CallRequest",
		hasDefaultParams: true,
	},
	chainId: {
		name: "eth_chainId",
		params: [],
		requestName: "ChainIdRequest",
	},
	coinbase: {
		name: "eth_coinbase",
		params: [],
		requestName: "CoinbaseRequest",
	},
	createAccessList: {
		name: "eth_createAccessList",
		params: ["CallParams", "BlockSpec"],
		requestName: "CreateAccessListRequest",
		hasDefaultParams: true,
	},
	estimateGas: {
		name: "eth_estimateGas",
		params: ["CallParams"],
		requestName: "EstimateGasRequest",
	},
	feeHistory: {
		name: "eth_feeHistory",
		params: ["Quantity", "BlockSpec", "number[]"],
		requestName: "FeeHistoryRequest",
	},
	gasPrice: {
		name: "eth_gasPrice",
		params: [],
		requestName: "GasPriceRequest",
	},
	getBalance: {
		name: "eth_getBalance",
		params: ["Address", "BlockSpec"],
		requestName: "GetBalanceRequest",
		hasDefaultParams: true,
	},
	getBlockByHash: {
		name: "eth_getBlockByHash",
		params: ["Hash", "boolean"],
		requestName: "GetBlockByHashRequest",
		hasDefaultParams: true,
	},
	getBlockByNumber: {
		name: "eth_getBlockByNumber",
		params: ["BlockSpec", "boolean"],
		requestName: "GetBlockByNumberRequest",
		hasDefaultParams: true,
	},
	getBlockReceipts: {
		name: "eth_getBlockReceipts",
		params: ["BlockSpec"],
		requestName: "GetBlockReceiptsRequest",
	},
	getBlockTransactionCountByHash: {
		name: "eth_getBlockTransactionCountByHash",
		params: ["Hash"],
		requestName: "GetBlockTransactionCountByHashRequest",
	},
	getBlockTransactionCountByNumber: {
		name: "eth_getBlockTransactionCountByNumber",
		params: ["BlockSpec"],
		requestName: "GetBlockTransactionCountByNumberRequest",
	},
	getCode: {
		name: "eth_getCode",
		params: ["Address", "BlockSpec"],
		requestName: "GetCodeRequest",
		hasDefaultParams: true,
	},
	getFilterChanges: {
		name: "eth_getFilterChanges",
		params: ["Quantity"],
		requestName: "GetFilterChangesRequest",
	},
	getFilterLogs: {
		name: "eth_getFilterLogs",
		params: ["Quantity"],
		requestName: "GetFilterLogsRequest",
	},
	getLogs: {
		name: "eth_getLogs",
		params: ["any"],
		requestName: "GetLogsRequest",
	},
	getProof: {
		name: "eth_getProof",
		params: ["Address", "`0x${string}`[]", "BlockSpec"],
		requestName: "GetProofRequest",
		hasDefaultParams: true,
	},
	getStorageAt: {
		name: "eth_getStorageAt",
		params: ["Address", "Quantity", "BlockSpec"],
		requestName: "GetStorageAtRequest",
		hasDefaultParams: true,
	},
	getTransactionByBlockHashAndIndex: {
		name: "eth_getTransactionByBlockHashAndIndex",
		params: ["Hash", "Quantity"],
		requestName: "GetTransactionByBlockHashAndIndexRequest",
	},
	getTransactionByBlockNumberAndIndex: {
		name: "eth_getTransactionByBlockNumberAndIndex",
		params: ["BlockSpec", "Quantity"],
		requestName: "GetTransactionByBlockNumberAndIndexRequest",
	},
	getTransactionByHash: {
		name: "eth_getTransactionByHash",
		params: ["Hash"],
		requestName: "GetTransactionByHashRequest",
	},
	getTransactionCount: {
		name: "eth_getTransactionCount",
		params: ["Address", "BlockSpec"],
		requestName: "GetTransactionCountRequest",
		hasDefaultParams: true,
	},
	getTransactionReceipt: {
		name: "eth_getTransactionReceipt",
		params: ["Hash"],
		requestName: "GetTransactionReceiptRequest",
	},
	getUncleCountByBlockHash: {
		name: "eth_getUncleCountByBlockHash",
		params: ["Hash"],
		requestName: "GetUncleCountByBlockHashRequest",
	},
	getUncleCountByBlockNumber: {
		name: "eth_getUncleCountByBlockNumber",
		params: ["BlockSpec"],
		requestName: "GetUncleCountByBlockNumberRequest",
	},
	maxPriorityFeePerGas: {
		name: "eth_maxPriorityFeePerGas",
		params: [],
		requestName: "MaxPriorityFeePerGasRequest",
	},
	newBlockFilter: {
		name: "eth_newBlockFilter",
		params: [],
		requestName: "NewBlockFilterRequest",
	},
	newFilter: {
		name: "eth_newFilter",
		params: ["any"],
		requestName: "NewFilterRequest",
	},
	newPendingTransactionFilter: {
		name: "eth_newPendingTransactionFilter",
		params: [],
		requestName: "NewPendingTransactionFilterRequest",
	},
	sendRawTransaction: {
		name: "eth_sendRawTransaction",
		params: ["`0x${string}`"],
		requestName: "SendRawTransactionRequest",
	},
	sendTransaction: {
		name: "eth_sendTransaction",
		params: ["any"],
		requestName: "SendTransactionRequest",
	},
	sign: {
		name: "eth_sign",
		params: ["Address", "`0x${string}`"],
		requestName: "SignRequest",
	},
	signTransaction: {
		name: "eth_signTransaction",
		params: ["any"],
		requestName: "SignTransactionRequest",
	},
	simulateV1: {
		name: "eth_simulateV1",
		params: ["any"],
		requestName: "SimulateV1Request",
	},
	syncing: {
		name: "eth_syncing",
		params: [],
		requestName: "SyncingRequest",
	},
	uninstallFilter: {
		name: "eth_uninstallFilter",
		params: ["Quantity"],
		requestName: "UninstallFilterRequest",
	},
};

function addRequestConstructor(dir: string, config: MethodConfig) {
	const filePath = join(ETH_DIR, dir, `${config.name}.js`);

	if (!existsSync(filePath)) {
		console.log(`Skipping ${dir}: file not found`);
		return;
	}

	let content = readFileSync(filePath, "utf-8");

	// Skip if already has import
	if (content.includes("createRequest")) {
		console.log(`Skipping ${dir}: already has Request constructor`);
		return;
	}

	// Add import after first comment block
	const importStatement =
		"import { createRequest } from '../../types/JsonRpcRequest.js'\n";
	const typedefImport =
		" * @typedef {import('../../types/JsonRpcRequest.js').JsonRpcRequest} JsonRpcRequest\n";

	// Add import after fileoverview
	content = content.replace(
		/(\* @fileoverview[^\n]*\n \*\/\n)/,
		`$1\n${importStatement}`,
	);

	// Add JsonRpcRequest typedef
	content = content.replace(
		/( \* @typedef \{import\('\.\.\/\.\.\/types\/index\.js'\)\.BlockSpec\} BlockSpec\n \*\/)/,
		`$1\n * @typedef {import('../../types/JsonRpcRequest.js').JsonRpcRequest} JsonRpcRequest\n */`,
	);

	// Build Request typedef and constructor
	const paramTypes =
		config.params.length > 0 ? `[${config.params.join(", ")}]` : "[]";

	let requestConstructor = `\n/**\n * Request for \`${config.name}\`\n *\n * @typedef {JsonRpcRequest<'${config.name}', ${paramTypes}>} Request\n */\n\n`;

	// Build constructor function
	if (config.params.length === 0) {
		requestConstructor += `/**\n * Creates a ${config.name} JSON-RPC request\n *\n * @param {number | string | null} [id] - Optional request ID\n * @returns {Request}\n */\n`;
		requestConstructor += `export function ${config.requestName}(id = null) {\n`;
		requestConstructor += `\treturn /** @type {Request} */ (\n`;
		requestConstructor += `\t\tcreateRequest(method, [], id)\n`;
		requestConstructor += `\t)\n}\n`;
	} else {
		requestConstructor += `/**\n * Creates a ${config.name} JSON-RPC request\n *\n`;

		// Add param docs
		config.params.forEach((param, i) => {
			const paramName =
				[
					"address",
					"block",
					"params",
					"data",
					"filterId",
					"txHash",
					"blockHash",
					"storageKeys",
					"position",
					"index",
					"blockCount",
					"newestBlock",
					"rewardPercentiles",
					"signedTx",
					"fullTransactions",
				][i] || `param${i}`;
			const hasDefault =
				config.hasDefaultParams &&
				(paramName === "block" || paramName === "fullTransactions");
			requestConstructor += ` * @param {${param}} ${hasDefault ? `[${paramName}]` : paramName}\n`;
		});
		requestConstructor += ` * @param {number | string | null} [id] - Optional request ID\n * @returns {Request}\n */\n`;

		// Function signature
		const funcParams = config.params.map((_, i) => {
			const paramName =
				[
					"address",
					"block",
					"params",
					"data",
					"filterId",
					"txHash",
					"blockHash",
					"storageKeys",
					"position",
					"index",
					"blockCount",
					"newestBlock",
					"rewardPercentiles",
					"signedTx",
					"fullTransactions",
				][i] || `param${i}`;
			const hasDefault = config.hasDefaultParams && paramName === "block";
			return hasDefault
				? `${paramName} = 'latest'`
				: paramName === "fullTransactions" && config.hasDefaultParams
					? `${paramName} = false`
					: paramName;
		});

		requestConstructor += `export function ${config.requestName}(${funcParams.join(", ")}, id = null) {\n`;

		const callParams = config.params.map(
			(_, i) =>
				[
					"address",
					"block",
					"params",
					"data",
					"filterId",
					"txHash",
					"blockHash",
					"storageKeys",
					"position",
					"index",
					"blockCount",
					"newestBlock",
					"rewardPercentiles",
					"signedTx",
					"fullTransactions",
				][i] || `param${i}`,
		);

		requestConstructor += `\treturn /** @type {Request} */ (\n`;
		requestConstructor += `\t\tcreateRequest(method, [${callParams.join(", ")}], id)\n`;
		requestConstructor += `\t)\n}\n`;
	}

	// Add before last line
	content = content.trimEnd() + "\n" + requestConstructor;

	writeFileSync(filePath, content);
	console.log(`✓ Updated ${dir}`);
}

// Process all method directories
const dirs = readdirSync(ETH_DIR, { withFileTypes: true })
	.filter((d) => d.isDirectory())
	.map((d) => d.name);

for (const dir of dirs) {
	const config = methodConfigs[dir];
	if (config) {
		addRequestConstructor(dir, config);
	}
}

console.log("\nDone!");
