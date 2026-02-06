/**
 * Multicall3 Contract ABI
 *
 * Standard Multicall3 contract interface for batching calls.
 * Source: https://github.com/mds1/multicall
 *
 * @module examples/multicall/Multicall3Abi
 */

/**
 * Multicall3 ABI - Full contract interface
 *
 * Core functions:
 * - aggregate3: Batch calls with per-call failure handling
 * - aggregate3Value: Batch calls with ETH value
 * - aggregate: Legacy batch without failure handling
 *
 * Utility functions:
 * - getBlockNumber: Get current block number
 * - getCurrentBlockTimestamp: Get current block timestamp
 * - getEthBalance: Get ETH balance of address
 *
 * @type {const}
 */
export const multicall3Abi = [
	// aggregate3 - main function for batching calls
	{
		name: "aggregate3",
		type: "function",
		stateMutability: "view",
		inputs: [
			{
				name: "calls",
				type: "tuple[]",
				components: [
					{ name: "target", type: "address" },
					{ name: "allowFailure", type: "bool" },
					{ name: "callData", type: "bytes" },
				],
			},
		],
		outputs: [
			{
				name: "returnData",
				type: "tuple[]",
				components: [
					{ name: "success", type: "bool" },
					{ name: "returnData", type: "bytes" },
				],
			},
		],
	},

	// aggregate3Value - batch calls with ETH value
	{
		name: "aggregate3Value",
		type: "function",
		stateMutability: "payable",
		inputs: [
			{
				name: "calls",
				type: "tuple[]",
				components: [
					{ name: "target", type: "address" },
					{ name: "allowFailure", type: "bool" },
					{ name: "value", type: "uint256" },
					{ name: "callData", type: "bytes" },
				],
			},
		],
		outputs: [
			{
				name: "returnData",
				type: "tuple[]",
				components: [
					{ name: "success", type: "bool" },
					{ name: "returnData", type: "bytes" },
				],
			},
		],
	},

	// Legacy aggregate (no per-call failure handling)
	{
		name: "aggregate",
		type: "function",
		stateMutability: "view",
		inputs: [
			{
				name: "calls",
				type: "tuple[]",
				components: [
					{ name: "target", type: "address" },
					{ name: "callData", type: "bytes" },
				],
			},
		],
		outputs: [
			{ name: "blockNumber", type: "uint256" },
			{ name: "returnData", type: "bytes[]" },
		],
	},

	// tryAggregate - batch with global failure flag
	{
		name: "tryAggregate",
		type: "function",
		stateMutability: "view",
		inputs: [
			{ name: "requireSuccess", type: "bool" },
			{
				name: "calls",
				type: "tuple[]",
				components: [
					{ name: "target", type: "address" },
					{ name: "callData", type: "bytes" },
				],
			},
		],
		outputs: [
			{
				name: "returnData",
				type: "tuple[]",
				components: [
					{ name: "success", type: "bool" },
					{ name: "returnData", type: "bytes" },
				],
			},
		],
	},

	// Utility functions
	{
		name: "getBlockNumber",
		type: "function",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "blockNumber", type: "uint256" }],
	},
	{
		name: "getCurrentBlockTimestamp",
		type: "function",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "timestamp", type: "uint256" }],
	},
	{
		name: "getEthBalance",
		type: "function",
		stateMutability: "view",
		inputs: [{ name: "addr", type: "address" }],
		outputs: [{ name: "balance", type: "uint256" }],
	},
	{
		name: "getBlockHash",
		type: "function",
		stateMutability: "view",
		inputs: [{ name: "blockNumber", type: "uint256" }],
		outputs: [{ name: "blockHash", type: "bytes32" }],
	},
	{
		name: "getLastBlockHash",
		type: "function",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "blockHash", type: "bytes32" }],
	},
	{
		name: "getBasefee",
		type: "function",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "basefee", type: "uint256" }],
	},
	{
		name: "getChainId",
		type: "function",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "chainid", type: "uint256" }],
	},
];

/**
 * Minimal ABI for aggregate3 only
 *
 * Use this for smaller bundle size when only aggregate3 is needed.
 */
export const aggregate3Abi = [
	{
		name: "aggregate3",
		type: "function",
		stateMutability: "view",
		inputs: [
			{
				name: "calls",
				type: "tuple[]",
				components: [
					{ name: "target", type: "address" },
					{ name: "allowFailure", type: "bool" },
					{ name: "callData", type: "bytes" },
				],
			},
		],
		outputs: [
			{
				name: "returnData",
				type: "tuple[]",
				components: [
					{ name: "success", type: "bool" },
					{ name: "returnData", type: "bytes" },
				],
			},
		],
	},
];
