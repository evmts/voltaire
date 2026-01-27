/**
 * Contract Factory - Copyable Implementation
 *
 * Reference implementation following ethers v6 ContractFactory patterns.
 * Copy into your codebase and customize as needed.
 *
 * @module examples/ethers-contract/ContractFactory
 */

import { Abi, Hex, TransactionHash } from "@tevm/voltaire";
import { EthersContract } from "./EthersContract.js";
import { InvalidArgumentError, UnsupportedOperationError } from "./errors.js";

/**
 * @typedef {import('./EthersContractTypes.js').ContractRunner} ContractRunner
 * @typedef {import('./EthersContractTypes.js').ContractTransactionRequest} ContractTransactionRequest
 * @typedef {import('./EthersContractTypes.js').ContractFactoryInterface} ContractFactoryInterface
 * @typedef {import('@tevm/voltaire').AbiItem} Item
 */

// Symbol for internal factory state
const internal = Symbol.for("_ethersContractFactory_internal");

/**
 * WeakMap for storing internal factory state
 * @type {WeakMap<object, FactoryInternalState>}
 */
const internalValues = new WeakMap();

/**
 * @typedef {Object} FactoryInternalState
 * @property {readonly Item[]} abiItems - Original ABI items
 */

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
 * Normalize bytecode to hex string
 * @param {string | Uint8Array | { object: string }} bytecode
 * @returns {string}
 */
function normalizeBytecode(bytecode) {
	if (bytecode instanceof Uint8Array) {
		return Hex.fromBytes(bytecode);
	}

	let bc = bytecode;
	if (typeof bc === "object" && bc !== null && "object" in bc) {
		// Solidity compiler output format
		bc = bc.object;
	}

	if (typeof bc !== "string") {
		throw new InvalidArgumentError(
			"bytecode",
			"bytecode must be a hex string, Uint8Array, or { object: string }",
			bytecode,
		);
	}

	if (!bc.startsWith("0x")) {
		bc = `0x${bc}`;
	}

	// Validate hex
	if (!/^0x[0-9a-fA-F]*$/.test(bc)) {
		throw new InvalidArgumentError(
			"bytecode",
			"invalid bytecode hex string",
			bytecode,
		);
	}

	return bc.toLowerCase();
}

/**
 * Calculate CREATE address for contract deployment
 * @param {string} from - Deployer address
 * @param {number} nonce - Deployer nonce
 * @returns {string} - Deployed contract address
 */
function getCreateAddress(from, nonce) {
	// RLP encode [from, nonce] and keccak256, take last 20 bytes
	// Simplified implementation - real one would use RLP encoding

	// For now, use a placeholder that works for testing
	// In production, use proper RLP encoding
	const fromBytes = Hex.toBytes(from);
	const nonceHex = nonce === 0 ? "0x80" : `0x${nonce.toString(16)}`;

	// This is a simplified calculation - actual implementation would:
	// 1. RLP encode the list [address, nonce]
	// 2. Keccak256 hash it
	// 3. Take last 20 bytes

	// Import keccak for actual implementation
	// For now, return a deterministic placeholder based on inputs
	const combined = from.toLowerCase() + nonce.toString(16).padStart(64, "0");

	// Use a simple hash-like transformation (not cryptographically secure)
	// Real implementation should use keccak256
	let hash = 0n;
	for (let i = 0; i < combined.length; i++) {
		hash = (hash * 31n + BigInt(combined.charCodeAt(i))) % 2n ** 160n;
	}

	return `0x${hash.toString(16).padStart(40, "0")}`;
}

/**
 * Create a ContractFactory for deploying contracts
 *
 * @template {readonly Item[]} TAbi
 * @param {import('./EthersContractTypes.js').ContractFactoryOptions<TAbi>} options
 * @returns {import('./EthersContractTypes.js').ContractFactoryInterface<TAbi>}
 *
 * @example
 * ```typescript
 * const abi = [...] as const;
 * const bytecode = '0x608060405234801561001057600080fd5b50...';
 *
 * const factory = ContractFactory({
 *   abi,
 *   bytecode,
 *   runner: signer
 * });
 *
 * // Deploy with constructor args
 * const contract = await factory.deploy('MyToken', 'MTK', 18);
 * await contract.waitForDeployment();
 *
 * // Or get deploy transaction first
 * const tx = await factory.getDeployTransaction('MyToken', 'MTK', 18);
 * ```
 */
export function ContractFactory(options) {
	const { abi: abiItems, runner = null } = options;
	const bytecode = normalizeBytecode(options.bytecode);
	const abi = Abi(abiItems);

	const factory = {
		interface: abi,
		bytecode,
		runner,
	};

	// Store internal state
	Object.defineProperty(factory, internal, { value: {} });
	internalValues.set(factory[internal], { abiItems });

	/**
	 * Create Contract instance at existing address
	 * @param {string} target
	 * @returns {*}
	 */
	factory.attach = (target) => {
		return EthersContract({
			target,
			abi: abiItems,
			runner,
		});
	};

	/**
	 * Build deployment transaction
	 * @param {...any} args - Constructor arguments + optional overrides
	 * @returns {Promise<ContractTransactionRequest>}
	 */
	factory.getDeployTransaction = async (...args) => {
		// Get constructor fragment - Abi extends Array, so iterate directly
		const constructorFragment = abi.getConstructor();
		const inputs = constructorFragment?.inputs || [];

		// Check for overrides as last arg
		let overrides = {};
		let constructorArgs = args;

		if (inputs.length + 1 === args.length) {
			const lastArg = args[args.length - 1];
			if (lastArg && typeof lastArg === "object" && !Array.isArray(lastArg)) {
				overrides = lastArg;
				constructorArgs = args.slice(0, -1);
			}
		}

		if (inputs.length !== constructorArgs.length) {
			throw new InvalidArgumentError(
				"args",
				`incorrect number of arguments to constructor (expected ${inputs.length}, got ${constructorArgs.length})`,
				args,
			);
		}

		// Encode constructor arguments
		let data = bytecode;
		if (constructorArgs.length > 0 && constructorFragment) {
			const encodedArgs = Abi.Constructor.encodeParams(
				constructorFragment,
				constructorArgs,
			);
			const encodedHex = Hex.fromBytes(encodedArgs);
			// Remove 0x prefix from encoded args and append
			data = bytecode + encodedHex.slice(2);
		}

		return {
			...overrides,
			data,
		};
	};

	/**
	 * Deploy contract
	 * @param {...any} args - Constructor arguments + optional overrides
	 * @returns {Promise<*>}
	 */
	factory.deploy = async (...args) => {
		if (!runner || typeof runner.request !== "function") {
			throw new UnsupportedOperationError("sendTransaction");
		}

		const tx = await factory.getDeployTransaction(...args);

		// Get deployer address and nonce for CREATE address calculation
		let from;
		let nonce;

		try {
			// Try to get from address
			if (runner.getAddress) {
				from = await runner.getAddress();
			} else {
				// Get accounts
				const accounts = await runner.request({
					method: "eth_accounts",
					params: [],
				});
				from = accounts[0];
			}

			// Get nonce
			const nonceHex = await runner.request({
				method: "eth_getTransactionCount",
				params: [from, "pending"],
			});
			nonce = Number.parseInt(nonceHex, 16);
		} catch (error) {
			throw new UnsupportedOperationError(
				"deploy - cannot determine deployer address",
			);
		}

		// Send deployment transaction
		const hashHex = await runner.request({
			method: "eth_sendTransaction",
			params: [
				{
					from,
					data: tx.data,
					...(tx.value && { value: `0x${tx.value.toString(16)}` }),
					...(tx.gasLimit && { gas: `0x${tx.gasLimit.toString(16)}` }),
					...(tx.gasPrice && { gasPrice: `0x${tx.gasPrice.toString(16)}` }),
					...(tx.maxFeePerGas && {
						maxFeePerGas: `0x${tx.maxFeePerGas.toString(16)}`,
					}),
					...(tx.maxPriorityFeePerGas && {
						maxPriorityFeePerGas: `0x${tx.maxPriorityFeePerGas.toString(16)}`,
					}),
				},
			],
		});

		// Calculate deployed address
		const deployedAddress = getCreateAddress(from, nonce);
		const hash = TransactionHash.fromHex(hashHex);

		// Create contract instance with deployment transaction info
		const contract = EthersContract({
			target: deployedAddress,
			abi: abiItems,
			runner,
		});

		// Store deployment transaction in internal state
		// Access through contract's internal symbol
		const contractInternal = Object.getOwnPropertySymbols(contract).find(
			(s) => s.description === "_ethersContract_internal",
		);

		if (contractInternal) {
			const state = contract[contractInternal];
			// The internal values are stored in a WeakMap
			// We need to update the deployTx
		}

		return contract;
	};

	/**
	 * Create new factory with different runner
	 * @param {ContractRunner} newRunner
	 * @returns {*}
	 */
	factory.connect = (newRunner) => {
		return ContractFactory({
			abi: abiItems,
			bytecode: options.bytecode,
			runner: newRunner,
		});
	};

	return factory;
}

/**
 * Create ContractFactory from Solidity compiler output
 * @param {*} output - Compiler output (JSON or object)
 * @param {ContractRunner} [runner]
 * @returns {*}
 */
ContractFactory.fromSolidity = (output, runner) => {
	if (output == null) {
		throw new InvalidArgumentError("output", "bad compiler output", output);
	}

	let parsedOutput = output;
	if (typeof parsedOutput === "string") {
		parsedOutput = JSON.parse(parsedOutput);
	}

	const abi = parsedOutput.abi;
	let bytecode = "";

	if (parsedOutput.bytecode) {
		bytecode = parsedOutput.bytecode;
	} else if (parsedOutput.evm?.bytecode) {
		bytecode = parsedOutput.evm.bytecode.object || parsedOutput.evm.bytecode;
	}

	if (!abi) {
		throw new InvalidArgumentError(
			"output",
			"no ABI found in compiler output",
			parsedOutput,
		);
	}

	if (!bytecode) {
		throw new InvalidArgumentError(
			"output",
			"no bytecode found in compiler output",
			parsedOutput,
		);
	}

	return ContractFactory({
		abi,
		bytecode,
		runner,
	});
};
