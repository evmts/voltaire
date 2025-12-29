/**
 * Ethers-style Contract - Copyable Implementation
 *
 * Reference implementation following ethers v6 Contract patterns.
 * Copy into your codebase and customize as needed.
 *
 * Key features:
 * - contract.functionName(...args) for default call behavior
 * - contract.functionName.staticCall() for view simulation
 * - contract.functionName.send() for transactions
 * - contract.functionName.estimateGas() for gas estimation
 * - contract.filters.EventName() for event filters
 * - contract.on/once/off for event subscriptions
 * - contract.connect(runner) / contract.attach(target) patterns
 *
 * @module examples/ethers-contract/EthersContract
 */

import { Abi } from "../../src/primitives/Abi/Abi.js";
import * as Event from "../../src/primitives/Abi/event/index.js";
import { Address } from "../../src/primitives/Address/index.js";
import * as Hex from "../../src/primitives/Hex/index.js";
import * as Hash from "../../src/primitives/Hash/index.js";
import * as BlockNumber from "../../src/primitives/BlockNumber/index.js";
import * as TransactionHash from "../../src/primitives/TransactionHash/index.js";
import {
	UnsupportedOperationError,
	CallExceptionError,
	FunctionNotFoundError,
	EventNotFoundError,
	AmbiguousMatchError,
	decodeRevertReason,
} from "./errors.js";

/**
 * @typedef {import('./EthersContractTypes.js').ContractRunner} ContractRunner
 * @typedef {import('./EthersContractTypes.js').EthersContract} EthersContractInstance
 * @typedef {import('./EthersContractTypes.js').ContractTransactionRequest} ContractTransactionRequest
 * @typedef {import('./EthersContractTypes.js').ContractTransactionResponse} ContractTransactionResponse
 * @typedef {import('./EthersContractTypes.js').DecodedEventLog} DecodedEventLog
 * @typedef {import('./EthersContractTypes.js').PreparedTopicFilter} PreparedTopicFilter
 * @typedef {import('../../src/primitives/Abi/AbiType.js').Item} Item
 */

// Symbol for internal state (follows ethers pattern)
const internal = Symbol.for("_ethersContract_internal");

/**
 * WeakMap for storing internal contract state
 * @type {WeakMap<object, ContractInternalState>}
 */
const internalValues = new WeakMap();

/**
 * @typedef {Object} ContractInternalState
 * @property {Promise<string>} addrPromise
 * @property {string|null} addr
 * @property {ContractTransactionResponse|null} deployTx
 * @property {Map<string, SubscriptionState>} subs
 */

/**
 * @typedef {Object} SubscriptionState
 * @property {string} tag
 * @property {Array<{listener: Function, once: boolean}>} listeners
 * @property {Function} start
 * @property {Function} stop
 */

/**
 * Get internal state for contract
 * @param {*} contract
 * @returns {ContractInternalState}
 */
function getInternal(contract) {
	return internalValues.get(contract[internal]);
}

/**
 * Set internal state for contract
 * @param {*} contract
 * @param {ContractInternalState} values
 */
function setInternal(contract, values) {
	internalValues.set(contract[internal], values);
}

/**
 * Check if runner can make calls
 * @param {*} runner
 * @returns {boolean}
 */
function canCall(runner) {
	return runner && typeof runner.request === "function";
}

/**
 * Check if runner can send transactions
 * @param {*} runner
 * @returns {boolean}
 */
function canSend(runner) {
	return (
		runner &&
		(typeof runner.sendTransaction === "function" ||
			typeof runner.request === "function")
	);
}

/**
 * Get provider from runner
 * @param {*} runner
 * @returns {*}
 */
function getProvider(runner) {
	if (!runner) return null;
	return runner.provider || runner;
}

/**
 * Check if value is a hex string
 * @param {string} value
 * @param {number} [length]
 * @returns {boolean}
 */
function isHexString(value, length) {
	if (typeof value !== "string" || !value.startsWith("0x")) return false;
	if (length !== undefined && value.length !== 2 + length * 2) return false;
	return /^0x[0-9a-fA-F]*$/.test(value);
}

/**
 * Copy transaction overrides
 * @param {*} overrides
 * @returns {ContractTransactionRequest}
 */
function copyOverrides(overrides) {
	if (!overrides || typeof overrides !== "object") return {};
	const result = {};
	const allowed = [
		"from",
		"to",
		"data",
		"value",
		"gasLimit",
		"gasPrice",
		"maxFeePerGas",
		"maxPriorityFeePerGas",
		"nonce",
		"chainId",
	];
	for (const key of allowed) {
		if (key in overrides && overrides[key] !== undefined) {
			result[key] = overrides[key];
		}
	}
	return result;
}

/**
 * Build wrapped function for contract method
 * @param {*} contract
 * @param {string} key
 * @returns {Function}
 */
function buildWrappedMethod(contract, key) {
	const abi = contract.interface;

	/**
	 * Get matching function fragment
	 * @param  {...any} args
	 * @returns {*}
	 */
	const getFragment = (...args) => {
		// Try to get by exact name first
		let fn = abi.getFunction(key);

		if (!fn) {
			// Check for selector (0x prefix + 4 bytes)
			if (isHexString(key, 4)) {
				// Find by selector
				for (const item of abi.items) {
					if (item.type === "function") {
						const selector = abi.encode(item.name, []).slice(0, 4);
						const selectorHex = Hex.fromBytes(selector).toLowerCase();
						if (selectorHex === key.toLowerCase()) {
							fn = item;
							break;
						}
					}
				}
			}
		}

		if (!fn) {
			throw new FunctionNotFoundError(key, args);
		}

		return fn;
	};

	/**
	 * Build populated transaction
	 * @param  {...any} args
	 * @returns {Promise<ContractTransactionRequest>}
	 */
	const populateTransaction = async (...args) => {
		const fragment = getFragment(...args);

		// Check if last arg is overrides
		let overrides = {};
		let callArgs = args;
		if (fragment.inputs.length + 1 === args.length) {
			overrides = copyOverrides(args[args.length - 1]);
			callArgs = args.slice(0, -1);
		}

		const data = abi.encode(fragment.name, callArgs);
		const dataHex = Hex.fromBytes(data);
		const to = await contract.getAddress();

		return {
			...overrides,
			to,
			data: dataHex,
		};
	};

	/**
	 * Execute static call (eth_call)
	 * @param  {...any} args
	 * @returns {Promise<*>}
	 */
	const staticCall = async (...args) => {
		const runner = getProvider(contract.runner);
		if (!canCall(runner)) {
			throw new UnsupportedOperationError("call");
		}

		const fragment = getFragment(...args);
		const tx = await populateTransaction(...args);

		try {
			const result = await runner.request({
				method: "eth_call",
				params: [
					{
						to: tx.to,
						data: tx.data,
						...(tx.from && { from: tx.from }),
						...(tx.value && { value: `0x${tx.value.toString(16)}` }),
					},
					"latest",
				],
			});

			const decoded = abi.decode(fragment.name, Hex.toBytes(result));
			return decoded.length === 1 ? decoded[0] : decoded;
		} catch (error) {
			// Try to decode revert reason
			if (error && typeof error === "object" && "data" in error) {
				const reason = decodeRevertReason(Hex.toBytes(error.data));
				throw new CallExceptionError(reason || "execution reverted", {
					transaction: tx,
				});
			}
			throw error;
		}
	};

	/**
	 * Send transaction
	 * @param  {...any} args
	 * @returns {Promise<ContractTransactionResponse>}
	 */
	const send = async (...args) => {
		const runner = contract.runner;
		if (!canSend(runner)) {
			throw new UnsupportedOperationError("sendTransaction");
		}

		const tx = await populateTransaction(...args);

		// Use eth_sendTransaction via provider
		const hashHex = await runner.request({
			method: "eth_sendTransaction",
			params: [
				{
					to: tx.to,
					data: tx.data,
					...(tx.from && { from: tx.from }),
					...(tx.value && { value: `0x${tx.value.toString(16)}` }),
					...(tx.gasLimit && { gas: `0x${tx.gasLimit.toString(16)}` }),
					...(tx.gasPrice && { gasPrice: `0x${tx.gasPrice.toString(16)}` }),
					...(tx.maxFeePerGas && {
						maxFeePerGas: `0x${tx.maxFeePerGas.toString(16)}`,
					}),
					...(tx.maxPriorityFeePerGas && {
						maxPriorityFeePerGas: `0x${tx.maxPriorityFeePerGas.toString(16)}`,
					}),
					...(tx.nonce !== undefined && {
						nonce: `0x${tx.nonce.toString(16)}`,
					}),
				},
			],
		});

		const hash = TransactionHash.fromHex(hashHex);
		const provider = getProvider(runner);

		return createTransactionResponse(hash, tx, provider, abi);
	};

	/**
	 * Estimate gas
	 * @param  {...any} args
	 * @returns {Promise<bigint>}
	 */
	const estimateGas = async (...args) => {
		const runner = getProvider(contract.runner);
		if (!canCall(runner)) {
			throw new UnsupportedOperationError("estimateGas");
		}

		const tx = await populateTransaction(...args);

		const gasHex = await runner.request({
			method: "eth_estimateGas",
			params: [
				{
					to: tx.to,
					data: tx.data,
					...(tx.from && { from: tx.from }),
					...(tx.value && { value: `0x${tx.value.toString(16)}` }),
				},
			],
		});

		return BigInt(gasHex);
	};

	/**
	 * Default method behavior
	 * @param  {...any} args
	 * @returns {Promise<*>}
	 */
	const method = async (...args) => {
		const fragment = getFragment(...args);

		// View/pure functions use staticCall by default
		if (
			fragment.stateMutability === "view" ||
			fragment.stateMutability === "pure"
		) {
			return staticCall(...args);
		}

		// State-changing functions use send
		return send(...args);
	};

	// Attach additional methods
	Object.defineProperties(method, {
		name: {
			value: key,
			enumerable: true,
		},
		_contract: {
			value: contract,
		},
		_key: {
			value: key,
		},
		getFragment: {
			value: getFragment,
			enumerable: true,
		},
		estimateGas: {
			value: estimateGas,
			enumerable: true,
		},
		populateTransaction: {
			value: populateTransaction,
			enumerable: true,
		},
		send: {
			value: send,
			enumerable: true,
		},
		staticCall: {
			value: staticCall,
			enumerable: true,
		},
		fragment: {
			get: () => getFragment(),
			enumerable: true,
		},
	});

	return method;
}

/**
 * Build wrapped event filter factory
 * @param {*} contract
 * @param {string} key
 * @returns {Function}
 */
function buildWrappedEvent(contract, key) {
	const abi = contract.interface;

	const getFragment = () => {
		const event = abi.getEvent(key);
		if (!event) {
			throw new EventNotFoundError(key);
		}
		return event;
	};

	/**
	 * Create prepared topic filter
	 * @param  {...any} args
	 * @returns {PreparedTopicFilter}
	 */
	const method = (...args) => {
		const fragment = getFragment();
		const filterObj = args[0] || {};

		return {
			fragment,
			async getTopicFilter() {
				const topics = Event.encodeTopics(fragment, filterObj);
				return topics.map((t) => (t === null ? null : Hex.fromBytes(t)));
			},
		};
	};

	Object.defineProperties(method, {
		name: {
			value: key,
			enumerable: true,
		},
		_contract: {
			value: contract,
		},
		_key: {
			value: key,
		},
		getFragment: {
			value: getFragment,
			enumerable: true,
		},
		fragment: {
			get: getFragment,
			enumerable: true,
		},
	});

	return method;
}

/**
 * Create transaction response wrapper
 * @param {*} hash
 * @param {ContractTransactionRequest} tx
 * @param {*} provider
 * @param {*} abi
 * @returns {ContractTransactionResponse}
 */
function createTransactionResponse(hash, tx, provider, abi) {
	const response = {
		hash,
		from: tx.from || "",
		to: tx.to || null,
		data: tx.data || "0x",
		value: tx.value || 0n,
		nonce: tx.nonce || 0,
		gasLimit: tx.gasLimit || 0n,
		gasPrice: tx.gasPrice,
		maxFeePerGas: tx.maxFeePerGas,
		maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
		chainId: tx.chainId || 0n,
		blockNumber: null,
		blockHash: null,
		confirmations: 0,

		async wait(confirms = 1) {
			if (!provider) return null;

			// Poll for receipt
			const hashHex = Hex.fromBytes(hash);
			let receipt = null;

			while (!receipt) {
				try {
					receipt = await provider.request({
						method: "eth_getTransactionReceipt",
						params: [hashHex],
					});
				} catch {
					// Ignore errors, keep polling
				}

				if (!receipt) {
					await new Promise((r) => setTimeout(r, 1000));
				}
			}

			// Decode logs
			const logs = (receipt.logs || []).map((log) => {
				try {
					const event = abi.getEvent(log.topics[0]);
					if (event) {
						const args = Event.decodeLog(
							event,
							Hex.toBytes(log.data),
							log.topics.map((t) => Hex.toBytes(t)),
						);
						return {
							eventName: event.name,
							args,
							blockNumber: BlockNumber.from(BigInt(log.blockNumber)),
							blockHash: Hash.fromHex(log.blockHash),
							transactionHash: TransactionHash.fromHex(log.transactionHash),
							logIndex: Number.parseInt(log.logIndex, 16),
							address: log.address,
							topics: log.topics,
							data: log.data,
						};
					}
				} catch {
					// Return raw log if decoding fails
				}
				return log;
			});

			return {
				to: receipt.to,
				from: receipt.from,
				contractAddress: receipt.contractAddress,
				hash,
				blockNumber: Number.parseInt(receipt.blockNumber, 16),
				blockHash: receipt.blockHash,
				logsBloom: receipt.logsBloom,
				gasUsed: BigInt(receipt.gasUsed),
				cumulativeGasUsed: BigInt(receipt.cumulativeGasUsed),
				status: Number.parseInt(receipt.status, 16),
				logs,
			};
		},
	};

	return response;
}

/**
 * Get subscription info for an event
 * @param {*} contract
 * @param {*} event
 * @returns {Promise<{fragment: *, tag: string, topics: string[]}>}
 */
async function getSubInfo(contract, event) {
	let topics;
	let fragment = null;

	if (typeof event === "string") {
		if (isHexString(event, 32)) {
			// Topic hash
			topics = [event];
		} else if (event === "*") {
			// All events
			topics = [null];
		} else {
			// Event name
			fragment = contract.interface.getEvent(event);
			if (!fragment) {
				throw new EventNotFoundError(event);
			}
			const topicBytes = Event.encodeTopics(fragment, {});
			topics = [topicBytes[0] ? Hex.fromBytes(topicBytes[0]) : null];
		}
	} else if (event && typeof event.getTopicFilter === "function") {
		// PreparedTopicFilter
		topics = await event.getTopicFilter();
		fragment = event.fragment;
	} else if (event && event.type === "event") {
		// Event fragment directly
		fragment = event;
		const topicBytes = Event.encodeTopics(fragment, {});
		topics = [topicBytes[0] ? Hex.fromBytes(topicBytes[0]) : null];
	} else {
		throw new EventNotFoundError(String(event));
	}

	const tag = topics
		.map((t) => {
			if (t === null) return "null";
			if (Array.isArray(t)) return t.join("|");
			return t;
		})
		.join("&");

	return { fragment, tag, topics };
}

/**
 * Properties that should pass through Proxy without interception
 */
const passProperties = ["then", "catch", "finally"];

/**
 * Create an ethers-style Contract instance
 *
 * @template {readonly Item[]} TAbi
 * @param {import('./EthersContractTypes.js').EthersContractOptions<TAbi>} options
 * @returns {import('./EthersContractTypes.js').EthersContract<TAbi>}
 *
 * @example
 * ```typescript
 * const erc20Abi = [...] as const;
 *
 * const usdc = EthersContract({
 *   target: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *   abi: erc20Abi,
 *   runner: provider
 * });
 *
 * // Default behavior (staticCall for view, send for state-changing)
 * const balance = await usdc.balanceOf(address);
 * const tx = await usdc.transfer(to, amount);
 *
 * // Explicit methods
 * const simulated = await usdc.transfer.staticCall(to, amount);
 * const gas = await usdc.transfer.estimateGas(to, amount);
 * const populated = await usdc.transfer.populateTransaction(to, amount);
 *
 * // Events
 * const filter = usdc.filters.Transfer({ from: address });
 * const logs = await usdc.queryFilter(filter, fromBlock, toBlock);
 *
 * // Subscriptions
 * await usdc.on('Transfer', (from, to, value, event) => {
 *   console.log(from, to, value);
 * });
 * ```
 */
export function EthersContract(options) {
	const { target, abi: abiItems, runner = null } = options;
	const abi = Abi(abiItems);

	// Create base contract object
	const contract = {
		target,
		interface: abi,
		runner,
		fallback: null, // TODO: implement fallback handling
	};

	// Internal state symbol
	Object.defineProperty(contract, internal, { value: {} });

	// Resolve address
	let addrPromise;
	let addr = null;

	if (isHexString(target, 20) || isHexString(target)) {
		// Already an address
		addr = target.toLowerCase();
		addrPromise = Promise.resolve(addr);
	} else {
		// ENS name - would need resolver
		// For now, assume it's an address
		addr = target;
		addrPromise = Promise.resolve(target);
	}

	// Store internal state
	setInternal(contract, {
		addrPromise,
		addr,
		deployTx: null,
		subs: new Map(),
	});

	// Build filters proxy
	const filters = new Proxy(
		{},
		{
			get(_target, prop) {
				if (typeof prop === "symbol" || passProperties.includes(prop)) {
					return Reflect.get(_target, prop);
				}
				try {
					return buildWrappedEvent(contract, String(prop));
				} catch {
					return undefined;
				}
			},
			has(_target, prop) {
				if (passProperties.includes(prop)) {
					return Reflect.has(_target, prop);
				}
				return abi.getEvent(String(prop)) !== undefined;
			},
		},
	);

	Object.defineProperty(contract, "filters", {
		value: filters,
		enumerable: true,
	});

	// Core methods
	contract.getAddress = async () => {
		return getInternal(contract).addrPromise;
	};

	contract.getDeployedCode = async () => {
		const provider = getProvider(runner);
		if (!provider) {
			throw new UnsupportedOperationError("getDeployedCode");
		}
		const address = await contract.getAddress();
		const code = await provider.request({
			method: "eth_getCode",
			params: [address, "latest"],
		});
		return code === "0x" ? null : code;
	};

	contract.waitForDeployment = async () => {
		const deployTx = getInternal(contract).deployTx;
		if (deployTx) {
			await deployTx.wait();
			return contract;
		}

		const code = await contract.getDeployedCode();
		if (code !== null) {
			return contract;
		}

		const provider = getProvider(runner);
		if (!provider) {
			throw new UnsupportedOperationError("waitForDeployment");
		}

		// Poll for deployment
		return new Promise((resolve, reject) => {
			const check = async () => {
				try {
					const code = await contract.getDeployedCode();
					if (code !== null) {
						resolve(contract);
						return;
					}
					setTimeout(check, 1000);
				} catch (error) {
					reject(error);
				}
			};
			check();
		});
	};

	contract.deploymentTransaction = () => {
		return getInternal(contract).deployTx;
	};

	contract.connect = (newRunner) => {
		return EthersContract({
			target,
			abi: abiItems,
			runner: newRunner,
		});
	};

	contract.attach = (newTarget) => {
		return EthersContract({
			target: newTarget,
			abi: abiItems,
			runner,
		});
	};

	contract.getFunction = (key) => {
		return buildWrappedMethod(contract, key);
	};

	contract.getEvent = (key) => {
		return buildWrappedEvent(contract, key);
	};

	contract.queryFilter = async (event, fromBlock = 0, toBlock = "latest") => {
		const provider = getProvider(runner);
		if (!provider) {
			throw new UnsupportedOperationError("queryFilter");
		}

		const { fragment, topics } = await getSubInfo(contract, event);
		const address = await contract.getAddress();

		const fromBlockHex =
			typeof fromBlock === "string"
				? fromBlock
				: `0x${BigInt(fromBlock).toString(16)}`;
		const toBlockHex =
			typeof toBlock === "string"
				? toBlock
				: `0x${BigInt(toBlock).toString(16)}`;

		const logs = await provider.request({
			method: "eth_getLogs",
			params: [
				{
					address,
					topics,
					fromBlock: fromBlockHex,
					toBlock: toBlockHex,
				},
			],
		});

		return logs.map((log) => {
			let foundFragment = fragment;
			if (!foundFragment) {
				try {
					foundFragment = abi.getEvent(log.topics[0]);
				} catch {
					// Ignore
				}
			}

			if (foundFragment) {
				try {
					const args = Event.decodeLog(
						foundFragment,
						Hex.toBytes(log.data),
						log.topics.map((t) => Hex.toBytes(t)),
					);
					return {
						eventName: foundFragment.name,
						args,
						blockNumber: BlockNumber.from(BigInt(log.blockNumber)),
						blockHash: Hash.fromHex(log.blockHash),
						transactionHash: TransactionHash.fromHex(log.transactionHash),
						logIndex: Number.parseInt(log.logIndex, 16),
						address: log.address,
						topics: log.topics,
						data: log.data,
					};
				} catch {
					// Fall through to raw log
				}
			}

			return log;
		});
	};

	// Event subscription methods
	contract.on = async (event, listener) => {
		const { subs } = getInternal(contract);
		const { tag, topics, fragment } = await getSubInfo(contract, event);
		const address = await contract.getAddress();

		let sub = subs.get(tag);
		if (!sub) {
			const provider = getProvider(runner);
			if (!provider) {
				throw new UnsupportedOperationError("on");
			}

			// Create subscription
			let subscriptionId = null;

			const start = async () => {
				if (subscriptionId) return;
				try {
					subscriptionId = await provider.request({
						method: "eth_subscribe",
						params: [
							"logs",
							{
								address,
								topics,
							},
						],
					});
				} catch {
					// Fallback to polling if subscriptions not supported
					// This is simplified - real impl would poll
				}
			};

			const stop = async () => {
				if (subscriptionId) {
					try {
						await provider.request({
							method: "eth_unsubscribe",
							params: [subscriptionId],
						});
					} catch {
						// Ignore
					}
					subscriptionId = null;
				}
			};

			sub = { tag, listeners: [], start, stop };
			subs.set(tag, sub);
		}

		sub.listeners.push({ listener, once: false });
		await sub.start();

		return contract;
	};

	contract.once = async (event, listener) => {
		const { subs } = getInternal(contract);
		const { tag, topics } = await getSubInfo(contract, event);
		const address = await contract.getAddress();

		let sub = subs.get(tag);
		if (!sub) {
			const provider = getProvider(runner);
			if (!provider) {
				throw new UnsupportedOperationError("once");
			}

			let subscriptionId = null;

			const start = async () => {
				if (subscriptionId) return;
				try {
					subscriptionId = await provider.request({
						method: "eth_subscribe",
						params: ["logs", { address, topics }],
					});
				} catch {
					// Fallback to polling
				}
			};

			const stop = async () => {
				if (subscriptionId) {
					try {
						await provider.request({
							method: "eth_unsubscribe",
							params: [subscriptionId],
						});
					} catch {
						// Ignore
					}
					subscriptionId = null;
				}
			};

			sub = { tag, listeners: [], start, stop };
			subs.set(tag, sub);
		}

		sub.listeners.push({ listener, once: true });
		await sub.start();

		return contract;
	};

	contract.off = async (event, listener) => {
		const { subs } = getInternal(contract);
		const { tag } = await getSubInfo(contract, event);

		const sub = subs.get(tag);
		if (!sub) return contract;

		if (listener) {
			const index = sub.listeners.findIndex((l) => l.listener === listener);
			if (index >= 0) {
				sub.listeners.splice(index, 1);
			}
		}

		if (!listener || sub.listeners.length === 0) {
			await sub.stop();
			subs.delete(tag);
		}

		return contract;
	};

	contract.emit = async (event, ...args) => {
		const { subs } = getInternal(contract);
		const { tag } = await getSubInfo(contract, event);

		const sub = subs.get(tag);
		if (!sub || sub.listeners.length === 0) return false;

		for (const { listener, once } of [...sub.listeners]) {
			try {
				listener(...args);
			} catch {
				// Ignore listener errors
			}
			if (once) {
				const index = sub.listeners.findIndex((l) => l.listener === listener);
				if (index >= 0) {
					sub.listeners.splice(index, 1);
				}
			}
		}

		if (sub.listeners.length === 0) {
			await sub.stop();
			subs.delete(tag);
		}

		return true;
	};

	contract.listenerCount = async (event) => {
		const { subs } = getInternal(contract);

		if (event) {
			const { tag } = await getSubInfo(contract, event);
			const sub = subs.get(tag);
			return sub ? sub.listeners.length : 0;
		}

		let total = 0;
		for (const sub of subs.values()) {
			total += sub.listeners.length;
		}
		return total;
	};

	contract.listeners = async (event) => {
		const { subs } = getInternal(contract);

		if (event) {
			const { tag } = await getSubInfo(contract, event);
			const sub = subs.get(tag);
			return sub ? sub.listeners.map((l) => l.listener) : [];
		}

		const result = [];
		for (const sub of subs.values()) {
			result.push(...sub.listeners.map((l) => l.listener));
		}
		return result;
	};

	contract.removeAllListeners = async (event) => {
		const { subs } = getInternal(contract);

		if (event) {
			const { tag } = await getSubInfo(contract, event);
			const sub = subs.get(tag);
			if (sub) {
				await sub.stop();
				subs.delete(tag);
			}
		} else {
			for (const [tag, sub] of subs) {
				await sub.stop();
				subs.delete(tag);
			}
		}

		return contract;
	};

	// Return Proxy for dynamic method access
	return new Proxy(contract, {
		get(target, prop, receiver) {
			// Handle symbols and existing properties
			if (
				typeof prop === "symbol" ||
				prop in target ||
				passProperties.includes(prop)
			) {
				return Reflect.get(target, prop, receiver);
			}

			// Try to get as function
			try {
				return buildWrappedMethod(contract, String(prop));
			} catch {
				return undefined;
			}
		},
		has(target, prop) {
			if (
				typeof prop === "symbol" ||
				prop in target ||
				passProperties.includes(prop)
			) {
				return Reflect.has(target, prop);
			}
			return abi.getFunction(String(prop)) !== undefined;
		},
	});
}

/**
 * Static factory method
 */
EthersContract.from = (target, abi, runner) => {
	return EthersContract({ target, abi, runner });
};
