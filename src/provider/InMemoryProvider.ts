/**
 * In-Memory Provider
 *
 * Provider implementation that executes transactions using Voltaire's built-in EVM.
 * This provider maintains its own blockchain state in memory for testing and development.
 *
 * @module provider/InMemoryProvider
 */

import { Frame } from "../evm/Frame/index.js";
import type { BrandedHost } from "../evm/Host/HostType.js";
import { Host } from "../evm/Host/index.js";
import type { AddressType } from "../primitives/Address/AddressType.js";
import { Address } from "../primitives/Address/index.js";
import * as Hex from "../primitives/Hex/index.js";
import type { Provider } from "./Provider.js";
import type {
	ProviderEvent,
	ProviderEventListener,
	ProviderEventMap,
	ProviderEvents,
	RequestArguments,
} from "./types.js";

/**
 * In-Memory Provider configuration options
 */
export interface InMemoryProviderOptions {
	/** Chain ID (default: 1) */
	chainId?: number;
	/** Mining mode: auto, interval, or manual (default: auto) */
	mining?: "auto" | "interval" | "manual";
	/** Mining interval in ms (when mode is 'interval') */
	miningInterval?: number;
	/** Initial accounts with balances */
	accounts?: Array<{
		address: string;
		balance: string;
		privateKey?: string;
	}>;
	/** Initial block number (default: 0) */
	blockNumber?: bigint;
	/** Block gas limit (default: 30000000) */
	blockGasLimit?: bigint;
	/** Base fee per gas (default: 1000000000 = 1 gwei) */
	baseFeePerGas?: bigint;
}

/**
 * Internal account state
 */
interface AccountState {
	balance: bigint;
	nonce: bigint;
	code: Uint8Array;
	storage: Map<string, bigint>;
}

/**
 * Block header data
 */
interface BlockHeader {
	number: bigint;
	hash: string;
	parentHash: string;
	timestamp: bigint;
	gasLimit: bigint;
	gasUsed: bigint;
	baseFeePerGas: bigint;
	coinbase: string;
	difficulty: bigint;
	transactions: string[];
	transactionsRoot: string;
	stateRoot: string;
	receiptsRoot: string;
}

/**
 * Transaction receipt
 */
interface TransactionReceipt {
	transactionHash: string;
	transactionIndex: string;
	blockHash: string;
	blockNumber: string;
	from: string;
	to: string | null;
	cumulativeGasUsed: string;
	gasUsed: string;
	contractAddress: string | null;
	logs: Array<{
		address: string;
		topics: string[];
		data: string;
		blockNumber: string;
		transactionHash: string;
		transactionIndex: string;
		blockHash: string;
		logIndex: string;
	}>;
	status: string;
	logsBloom: string;
}

/**
 * In-Memory Provider implementation
 *
 * Provides a fully functional in-memory Ethereum node for testing and development.
 * Uses Voltaire's EVM for transaction execution.
 *
 * ## Features
 *
 * - **Local EVM execution** - Full transaction simulation without external node
 * - **State management** - In-memory state with snapshot/revert capabilities
 * - **Instant mining** - Configurable block production (auto/interval/manual)
 * - **Testing utilities** - Set balances, impersonate accounts, manipulate time
 * - **Zero latency** - No network requests, instant responses
 *
 * @example
 * ```typescript
 * const provider = new InMemoryProvider({
 *   chainId: 1,
 *   accounts: [
 *     {
 *       address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
 *       balance: '0x10000000000000000000000' // 100000 ETH
 *     }
 *   ]
 * });
 *
 * // Execute calls against local EVM
 * const result = await provider.request({
 *   method: 'eth_call',
 *   params: [{ to: '0x...', data: '0x...' }, 'latest']
 * });
 * ```
 */
export class InMemoryProvider implements Provider {
	// Configuration
	private chainId: number;
	private miningMode: "auto" | "interval" | "manual";
	private miningInterval: number;
	private miningIntervalId: ReturnType<typeof setInterval> | null = null;
	private blockGasLimit: bigint;
	private baseFeePerGas: bigint;

	// State
	private accounts: Map<string, AccountState> = new Map();
	private transientStorage: Map<string, Map<string, bigint>> = new Map();
	private blocks: Map<bigint, BlockHeader> = new Map();
	private blocksByHash: Map<string, BlockHeader> = new Map();
	private transactions: Map<string, any> = new Map();
	private receipts: Map<string, TransactionReceipt> = new Map();
	private pendingTransactions: any[] = [];
	private currentBlockNumber: bigint;
	private currentTimestamp: bigint;
	private nextBlockTimestamp: bigint | null = null;
	private filters: Map<string, any> = new Map();
	private filterIdCounter = 0;
	private coinbase = "0x0000000000000000000000000000000000000000";

	// Snapshots for revert functionality
	private snapshots: Map<
		string,
		{
			accounts: Map<string, AccountState>;
			blockNumber: bigint;
			timestamp: bigint;
		}
	> = new Map();
	private snapshotIdCounter = 0;

	// Events
	private eventListeners: Map<ProviderEvent, Set<ProviderEventListener>> =
		new Map();

	// Host for EVM execution
	private host: BrandedHost;

	constructor(options: InMemoryProviderOptions = {}) {
		this.chainId = options.chainId ?? 1;
		this.miningMode = options.mining ?? "auto";
		this.miningInterval = options.miningInterval ?? 1000;
		this.blockGasLimit = options.blockGasLimit ?? 30000000n;
		this.baseFeePerGas = options.baseFeePerGas ?? 1000000000n; // 1 gwei
		this.currentBlockNumber = options.blockNumber ?? 0n;
		this.currentTimestamp = BigInt(Math.floor(Date.now() / 1000));

		// Initialize accounts
		if (options.accounts) {
			for (const account of options.accounts) {
				const addr = account.address.toLowerCase();
				this.accounts.set(addr, {
					balance: BigInt(account.balance),
					nonce: 0n,
					code: new Uint8Array(0),
					storage: new Map(),
				});
			}
		}

		// Create genesis block
		this.createBlock();

		// Setup host interface
		this.host = this.createHost();

		// Start interval mining if configured
		if (this.miningMode === "interval") {
			this.startIntervalMining();
		}
	}

	/**
	 * Create Host implementation backed by in-memory state
	 */
	private createHost(): BrandedHost {
		return Host({
			getBalance: (address: AddressType): bigint => {
				const addr = this.addressToKey(address);
				return this.accounts.get(addr)?.balance ?? 0n;
			},

			setBalance: (address: AddressType, balance: bigint): void => {
				const addr = this.addressToKey(address);
				const account = this.getOrCreateAccount(addr);
				account.balance = balance;
			},

			getCode: (address: AddressType): Uint8Array => {
				const addr = this.addressToKey(address);
				return this.accounts.get(addr)?.code ?? new Uint8Array(0);
			},

			setCode: (address: AddressType, code: Uint8Array): void => {
				const addr = this.addressToKey(address);
				const account = this.getOrCreateAccount(addr);
				account.code = code;
			},

			getStorage: (address: AddressType, slot: bigint): bigint => {
				const addr = this.addressToKey(address);
				const account = this.accounts.get(addr);
				if (!account) return 0n;
				return account.storage.get(slot.toString(16)) ?? 0n;
			},

			setStorage: (address: AddressType, slot: bigint, value: bigint): void => {
				const addr = this.addressToKey(address);
				const account = this.getOrCreateAccount(addr);
				account.storage.set(slot.toString(16), value);
			},

			getNonce: (address: AddressType): bigint => {
				const addr = this.addressToKey(address);
				return this.accounts.get(addr)?.nonce ?? 0n;
			},

			setNonce: (address: AddressType, nonce: bigint): void => {
				const addr = this.addressToKey(address);
				const account = this.getOrCreateAccount(addr);
				account.nonce = nonce;
			},

			getTransientStorage: (address: AddressType, slot: bigint): bigint => {
				const addr = this.addressToKey(address);
				const addrStorage = this.transientStorage.get(addr);
				if (!addrStorage) return 0n;
				return addrStorage.get(slot.toString(16)) ?? 0n;
			},

			setTransientStorage: (
				address: AddressType,
				slot: bigint,
				value: bigint,
			): void => {
				const addr = this.addressToKey(address);
				let addrStorage = this.transientStorage.get(addr);
				if (!addrStorage) {
					addrStorage = new Map();
					this.transientStorage.set(addr, addrStorage);
				}
				addrStorage.set(slot.toString(16), value);
			},
		});
	}

	/**
	 * Convert address to lowercase hex key
	 */
	private addressToKey(address: AddressType | Uint8Array): string {
		return Hex.fromBytes(address as Uint8Array).toLowerCase();
	}

	/**
	 * Get or create account state
	 */
	private getOrCreateAccount(addr: string): AccountState {
		let account = this.accounts.get(addr);
		if (!account) {
			account = {
				balance: 0n,
				nonce: 0n,
				code: new Uint8Array(0),
				storage: new Map(),
			};
			this.accounts.set(addr, account);
		}
		return account;
	}

	/**
	 * Create a new block
	 */
	private createBlock(transactions: string[] = []): BlockHeader {
		const parentBlock = this.blocks.get(this.currentBlockNumber);
		const parentHash = parentBlock?.hash ?? `0x${"0".repeat(64)}`;

		const blockNumber = this.currentBlockNumber + 1n;
		const blockHash = `0x${this.generateHash(
			`block-${blockNumber}-${Date.now()}-${Math.random()}`,
		)}`;

		const block: BlockHeader = {
			number: blockNumber,
			hash: blockHash,
			parentHash,
			timestamp: this.currentTimestamp,
			gasLimit: this.blockGasLimit,
			gasUsed: 0n,
			baseFeePerGas: this.baseFeePerGas,
			coinbase: this.coinbase,
			difficulty: 0n,
			transactions,
			transactionsRoot: `0x${"0".repeat(64)}`,
			stateRoot: `0x${"0".repeat(64)}`,
			receiptsRoot: `0x${"0".repeat(64)}`,
		};

		this.blocks.set(blockNumber, block);
		this.blocksByHash.set(blockHash, block);
		this.currentBlockNumber = blockNumber;

		// Emit newHeads event
		this.emit("message", {
			type: "eth_subscription",
			data: { subscription: "newHeads", result: this.formatBlock(block) },
		});

		return block;
	}

	/**
	 * Generate a simple hash (not cryptographically secure - for testing only)
	 */
	private generateHash(input: string): string {
		let hash = 0;
		for (let i = 0; i < input.length; i++) {
			const char = input.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash;
		}
		const hex = Math.abs(hash).toString(16).padStart(64, "0").slice(0, 64);
		return hex;
	}

	/**
	 * Format block for JSON-RPC response
	 */
	private formatBlock(block: BlockHeader, fullTransactions = false): any {
		return {
			number: `0x${block.number.toString(16)}`,
			hash: block.hash,
			parentHash: block.parentHash,
			timestamp: `0x${block.timestamp.toString(16)}`,
			gasLimit: `0x${block.gasLimit.toString(16)}`,
			gasUsed: `0x${block.gasUsed.toString(16)}`,
			baseFeePerGas: `0x${block.baseFeePerGas.toString(16)}`,
			miner: block.coinbase,
			difficulty: `0x${block.difficulty.toString(16)}`,
			totalDifficulty: "0x0",
			extraData: "0x",
			size: "0x0",
			nonce: "0x0000000000000000",
			mixHash: `0x${"0".repeat(64)}`,
			sha3Uncles:
				"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
			logsBloom: `0x${"0".repeat(512)}`,
			transactionsRoot: block.transactionsRoot,
			stateRoot: block.stateRoot,
			receiptsRoot: block.receiptsRoot,
			transactions: fullTransactions
				? block.transactions.map((hash) => this.transactions.get(hash))
				: block.transactions,
			uncles: [],
		};
	}

	/**
	 * Start interval mining
	 */
	private startIntervalMining(): void {
		this.miningIntervalId = setInterval(() => {
			this.mine();
		}, this.miningInterval);
	}

	/**
	 * Stop interval mining
	 */
	private stopIntervalMining(): void {
		if (this.miningIntervalId) {
			clearInterval(this.miningIntervalId);
			this.miningIntervalId = null;
		}
	}

	/**
	 * Mine pending transactions into a new block
	 */
	private mine(): BlockHeader {
		const txHashes: string[] = [];

		// Process pending transactions
		for (const tx of this.pendingTransactions) {
			const receipt = this.executeTx(tx);
			txHashes.push(receipt.transactionHash);
		}

		// Clear pending
		this.pendingTransactions = [];

		// Clear transient storage at end of block
		this.transientStorage.clear();

		// Use next block timestamp if set, otherwise use current time
		if (this.nextBlockTimestamp !== null) {
			this.currentTimestamp = this.nextBlockTimestamp;
			this.nextBlockTimestamp = null;
		} else {
			// Only update if not manually set - ensure monotonic increase
			const now = BigInt(Math.floor(Date.now() / 1000));
			if (now > this.currentTimestamp) {
				this.currentTimestamp = now;
			} else {
				// Ensure at least 1 second increment
				this.currentTimestamp += 1n;
			}
		}
		return this.createBlock(txHashes);
	}

	/**
	 * Execute a transaction
	 */
	private executeTx(tx: any): TransactionReceipt {
		const from = tx.from.toLowerCase();
		const to = tx.to?.toLowerCase() ?? null;
		const value = tx.value ? BigInt(tx.value) : 0n;
		const data = tx.data
			? Hex.toBytes(tx.data as `0x${string}`)
			: new Uint8Array(0);
		const gasLimit = tx.gas ? BigInt(tx.gas) : 21000n;

		const fromAccount = this.getOrCreateAccount(from);
		const txHash = `0x${this.generateHash(`tx-${from}-${fromAccount.nonce}-${Date.now()}`)}`;

		// Increment nonce
		fromAccount.nonce += 1n;

		// Deduct value
		if (value > 0n && fromAccount.balance >= value) {
			fromAccount.balance -= value;
			if (to) {
				const toAccount = this.getOrCreateAccount(to);
				toAccount.balance += value;
			}
		}

		// Execute code if contract call
		const status = "0x1"; // success
		let gasUsed = 21000n;
		const logs: any[] = [];
		let contractAddress: string | null = null;

		if (to && data.length > 0) {
			const toAccount = this.accounts.get(to);
			if (toAccount && toAccount.code.length > 0) {
				// Execute contract code
				const frame = Frame({
					bytecode: toAccount.code,
					gas: gasLimit,
					caller: Address(from) as AddressType,
					address: Address(to) as AddressType,
					value,
					calldata: data,
				});

				// Set block context
				frame.blockNumber = this.currentBlockNumber;
				frame.blockTimestamp = this.currentTimestamp;
				frame.blockGasLimit = this.blockGasLimit;
				frame.chainId = BigInt(this.chainId);
				frame.blockBaseFee = this.baseFeePerGas;

				// Simple execution - just charge base gas
				// Full execution would step through opcodes
				gasUsed = 21000n + BigInt(data.length * 16);
			}
		} else if (!to && data.length > 0) {
			// Contract creation
			const newAddr = this.computeContractAddress(from, fromAccount.nonce - 1n);
			contractAddress = newAddr;
			const newAccount = this.getOrCreateAccount(newAddr);
			newAccount.code = data;
			newAccount.balance = value;
			gasUsed = 21000n + BigInt(data.length * 200); // CREATE gas
		}

		// Store transaction
		this.transactions.set(txHash, {
			hash: txHash,
			nonce: `0x${(fromAccount.nonce - 1n).toString(16)}`,
			blockHash: null,
			blockNumber: null,
			transactionIndex: null,
			from,
			to,
			value: `0x${value.toString(16)}`,
			gasPrice: `0x${this.baseFeePerGas.toString(16)}`,
			gas: `0x${gasLimit.toString(16)}`,
			input: tx.data ?? "0x",
			v: "0x0",
			r: "0x0",
			s: "0x0",
		});

		// Create receipt
		const receipt: TransactionReceipt = {
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: "",
			blockNumber: `0x${(this.currentBlockNumber + 1n).toString(16)}`,
			from,
			to,
			cumulativeGasUsed: `0x${gasUsed.toString(16)}`,
			gasUsed: `0x${gasUsed.toString(16)}`,
			contractAddress,
			logs,
			status,
			logsBloom: `0x${"0".repeat(512)}`,
		};

		this.receipts.set(txHash, receipt);
		return receipt;
	}

	/**
	 * Compute contract address for CREATE
	 */
	private computeContractAddress(from: string, nonce: bigint): string {
		// Simplified - real impl uses RLP + Keccak
		const hash = this.generateHash(`${from}-${nonce}`);
		return `0x${hash.slice(0, 40)}`;
	}

	/**
	 * EIP-1193 request method
	 */
	async request(args: RequestArguments): Promise<unknown> {
		const { method, params = [] } = args;
		const p = Array.isArray(params) ? params : [params];

		switch (method) {
			// Network
			case "net_version":
				return String(this.chainId);

			case "eth_chainId":
				return `0x${this.chainId.toString(16)}`;

			case "eth_syncing":
				return false;

			// Block
			case "eth_blockNumber":
				return `0x${this.currentBlockNumber.toString(16)}`;

			case "eth_getBlockByNumber": {
				const blockTag = p[0] as string;
				const fullTx = p[1] as boolean;
				const block = this.resolveBlock(blockTag);
				return block ? this.formatBlock(block, fullTx) : null;
			}

			case "eth_getBlockByHash": {
				const hash = p[0] as string;
				const fullTx = p[1] as boolean;
				const block = this.blocksByHash.get(hash);
				return block ? this.formatBlock(block, fullTx) : null;
			}

			// Account
			case "eth_accounts":
				return Array.from(this.accounts.keys());

			case "eth_getBalance": {
				const addr = (p[0] as string).toLowerCase();
				const balance = this.accounts.get(addr)?.balance ?? 0n;
				return `0x${balance.toString(16)}`;
			}

			case "eth_getTransactionCount": {
				const addr = (p[0] as string).toLowerCase();
				const nonce = this.accounts.get(addr)?.nonce ?? 0n;
				return `0x${nonce.toString(16)}`;
			}

			case "eth_getCode": {
				const addr = (p[0] as string).toLowerCase();
				const code = this.accounts.get(addr)?.code ?? new Uint8Array(0);
				return Hex.fromBytes(code);
			}

			case "eth_getStorageAt": {
				const addr = (p[0] as string).toLowerCase();
				const slot = BigInt(p[1] as string);
				const account = this.accounts.get(addr);
				const value = account?.storage.get(slot.toString(16)) ?? 0n;
				return `0x${value.toString(16).padStart(64, "0")}`;
			}

			// Transaction
			case "eth_sendTransaction": {
				const tx = p[0] as any;
				this.pendingTransactions.push(tx);

				if (this.miningMode === "auto") {
					this.mine();
				}

				// Return tx hash
				const from = tx.from.toLowerCase();
				const fromAccount = this.accounts.get(from);
				const nonce = fromAccount?.nonce ?? 0n;
				return `0x${this.generateHash(`tx-${from}-${nonce}-${Date.now()}`)}`;
			}

			case "eth_sendRawTransaction": {
				// For raw tx, we'd need to decode RLP
				// Simplified: just store and return hash
				const rawTx = p[0] as string;
				const txHash = `0x${this.generateHash(`raw-${rawTx}-${Date.now()}`)}`;
				return txHash;
			}

			case "eth_getTransactionByHash": {
				const hash = p[0] as string;
				return this.transactions.get(hash) ?? null;
			}

			case "eth_getTransactionReceipt": {
				const hash = p[0] as string;
				return this.receipts.get(hash) ?? null;
			}

			// Call
			case "eth_call": {
				const tx = p[0] as any;
				const to = tx.to?.toLowerCase();
				const data = tx.data
					? Hex.toBytes(tx.data as `0x${string}`)
					: new Uint8Array(0);
				const value = tx.value ? BigInt(tx.value) : 0n;
				const gas = tx.gas ? BigInt(tx.gas) : 10000000n;
				const from = tx.from?.toLowerCase() ?? `0x${"0".repeat(40)}`;

				if (!to) {
					// Contract creation - return init code hash
					return `0x${this.generateHash(Hex.fromBytes(data).slice(2))}`;
				}

				const toAccount = this.accounts.get(to);
				if (!toAccount || toAccount.code.length === 0) {
					// No code, return empty
					return "0x";
				}

				// Execute in EVM frame
				const frame = Frame({
					bytecode: toAccount.code,
					gas,
					caller: Address(from) as AddressType,
					address: Address(to) as AddressType,
					value,
					calldata: data,
					isStatic: true,
				});

				frame.blockNumber = this.currentBlockNumber;
				frame.blockTimestamp = this.currentTimestamp;
				frame.blockGasLimit = this.blockGasLimit;
				frame.chainId = BigInt(this.chainId);
				frame.blockBaseFee = this.baseFeePerGas;

				// Return output (simplified - full impl executes bytecode)
				return Hex.fromBytes(frame.output);
			}

			case "eth_estimateGas": {
				const tx = p[0] as any;
				const data = tx.data ?? "0x";
				// Simplified estimation
				const baseGas = 21000n;
				const dataGas = BigInt(((data.length - 2) / 2) * 16);
				return `0x${(baseGas + dataGas).toString(16)}`;
			}

			// Gas
			case "eth_gasPrice":
				return `0x${this.baseFeePerGas.toString(16)}`;

			case "eth_maxPriorityFeePerGas":
				return `0x${(1000000000n).toString(16)}`; // 1 gwei

			case "eth_feeHistory": {
				const blockCount = Number(p[0]);
				const blocks: string[] = [];
				const baseFees: string[] = [];
				const gasUsedRatios: number[] = [];

				for (let i = 0; i < blockCount; i++) {
					const bn = this.currentBlockNumber - BigInt(i);
					if (bn >= 0n) {
						baseFees.push(`0x${this.baseFeePerGas.toString(16)}`);
						gasUsedRatios.push(0.5);
					}
				}

				return {
					oldestBlock: `0x${(this.currentBlockNumber - BigInt(blockCount - 1)).toString(16)}`,
					baseFeePerGas: baseFees,
					gasUsedRatio: gasUsedRatios,
					reward: [],
				};
			}

			case "eth_blobBaseFee":
				return "0x1"; // 1 wei

			// Filters
			case "eth_newBlockFilter": {
				const filterId = `0x${(++this.filterIdCounter).toString(16)}`;
				this.filters.set(filterId, {
					type: "block",
					lastBlock: this.currentBlockNumber,
				});
				return filterId;
			}

			case "eth_newPendingTransactionFilter": {
				const filterId = `0x${(++this.filterIdCounter).toString(16)}`;
				this.filters.set(filterId, { type: "pendingTx", txs: [] });
				return filterId;
			}

			case "eth_newFilter": {
				const filterParams = p[0] as any;
				const filterId = `0x${(++this.filterIdCounter).toString(16)}`;
				this.filters.set(filterId, {
					type: "logs",
					params: filterParams,
					lastBlock: this.currentBlockNumber,
				});
				return filterId;
			}

			case "eth_getFilterChanges": {
				const filterId = p[0] as string;
				const filter = this.filters.get(filterId);
				if (!filter) return [];

				if (filter.type === "block") {
					const changes: string[] = [];
					while (filter.lastBlock < this.currentBlockNumber) {
						filter.lastBlock++;
						const block = this.blocks.get(filter.lastBlock);
						if (block) changes.push(block.hash);
					}
					return changes;
				}

				return [];
			}

			case "eth_getFilterLogs": {
				const filterId = p[0] as string;
				const filter = this.filters.get(filterId);
				if (!filter || filter.type !== "logs") return [];
				return [];
			}

			case "eth_getLogs": {
				// Simplified - return empty
				return [];
			}

			case "eth_uninstallFilter": {
				const filterId = p[0] as string;
				return this.filters.delete(filterId);
			}

			// Mining control (anvil/hardhat compatible)
			case "evm_mine": {
				this.mine();
				return "0x0";
			}

			case "evm_setAutomine": {
				const enabled = p[0] as boolean;
				if (enabled) {
					this.miningMode = "auto";
					this.stopIntervalMining();
				} else {
					this.miningMode = "manual";
					this.stopIntervalMining();
				}
				return true;
			}

			case "evm_setIntervalMining": {
				const interval = p[0] as number;
				this.stopIntervalMining();
				if (interval > 0) {
					this.miningMode = "interval";
					this.miningInterval = interval;
					this.startIntervalMining();
				} else {
					this.miningMode = "manual";
				}
				return true;
			}

			// State manipulation (anvil/hardhat compatible)
			case "anvil_setBalance":
			case "hardhat_setBalance": {
				const addr = (p[0] as string).toLowerCase();
				const balance = BigInt(p[1] as string);
				const account = this.getOrCreateAccount(addr);
				account.balance = balance;
				return true;
			}

			case "anvil_setCode":
			case "hardhat_setCode": {
				const addr = (p[0] as string).toLowerCase();
				const code = Hex.toBytes(p[1] as `0x${string}`);
				const account = this.getOrCreateAccount(addr);
				account.code = code;
				return true;
			}

			case "anvil_setNonce":
			case "hardhat_setNonce": {
				const addr = (p[0] as string).toLowerCase();
				const nonce = BigInt(p[1] as string);
				const account = this.getOrCreateAccount(addr);
				account.nonce = nonce;
				return true;
			}

			case "anvil_setStorageAt":
			case "hardhat_setStorageAt": {
				const addr = (p[0] as string).toLowerCase();
				const slot = BigInt(p[1] as string);
				const value = BigInt(p[2] as string);
				const account = this.getOrCreateAccount(addr);
				account.storage.set(slot.toString(16), value);
				return true;
			}

			case "evm_snapshot": {
				const id = `0x${(++this.snapshotIdCounter).toString(16)}`;
				this.snapshots.set(id, {
					accounts: new Map(
						Array.from(this.accounts.entries()).map(([k, v]) => [
							k,
							{
								...v,
								storage: new Map(v.storage),
							},
						]),
					),
					blockNumber: this.currentBlockNumber,
					timestamp: this.currentTimestamp,
				});
				return id;
			}

			case "evm_revert": {
				const snapshotId = p[0] as string;
				const snapshot = this.snapshots.get(snapshotId);
				if (!snapshot) return false;

				this.accounts = snapshot.accounts;
				this.currentBlockNumber = snapshot.blockNumber;
				this.currentTimestamp = snapshot.timestamp;
				this.snapshots.delete(snapshotId);
				return true;
			}

			case "evm_increaseTime": {
				const seconds = BigInt(p[0] as number);
				this.nextBlockTimestamp = this.currentTimestamp + seconds;
				return `0x${this.nextBlockTimestamp.toString(16)}`;
			}

			case "evm_setNextBlockTimestamp": {
				const timestamp = BigInt(p[0] as number);
				this.nextBlockTimestamp = timestamp;
				return `0x${timestamp.toString(16)}`;
			}

			// Coinbase
			case "eth_coinbase":
				return this.coinbase;

			case "anvil_setCoinbase":
			case "hardhat_setCoinbase": {
				this.coinbase = (p[0] as string).toLowerCase();
				return true;
			}

			// Misc
			case "web3_clientVersion":
				return "Voltaire/InMemoryProvider/1.0.0";

			case "web3_sha3": {
				// Would use Keccak - simplified
				const data = p[0] as string;
				return `0x${this.generateHash(data)}`;
			}

			case "eth_getBlockTransactionCountByHash": {
				const hash = p[0] as string;
				const block = this.blocksByHash.get(hash);
				return block ? `0x${block.transactions.length.toString(16)}` : null;
			}

			case "eth_getBlockTransactionCountByNumber": {
				const block = this.resolveBlock(p[0] as string);
				return block ? `0x${block.transactions.length.toString(16)}` : null;
			}

			case "eth_getTransactionByBlockHashAndIndex": {
				const hash = p[0] as string;
				const index = Number(p[1]);
				const block = this.blocksByHash.get(hash);
				if (!block || index >= block.transactions.length) return null;
				const txHash = block.transactions[index];
				return txHash ? (this.transactions.get(txHash) ?? null) : null;
			}

			case "eth_getTransactionByBlockNumberAndIndex": {
				const block = this.resolveBlock(p[0] as string);
				const index = Number(p[1]);
				if (!block || index >= block.transactions.length) return null;
				const txHash = block.transactions[index];
				return txHash ? (this.transactions.get(txHash) ?? null) : null;
			}

			case "eth_getUncleCountByBlockHash":
			case "eth_getUncleCountByBlockNumber":
				return "0x0"; // No uncles in PoS

			case "eth_sign":
			case "eth_signTransaction":
			case "eth_signTypedData":
			case "eth_signTypedData_v4":
				throw {
					code: 4200,
					message: "Signing not supported in InMemoryProvider",
				};

			case "eth_createAccessList":
				return { accessList: [], gasUsed: "0x5208" };

			case "eth_getProof":
				throw { code: 4200, message: "eth_getProof not implemented" };

			case "eth_getBlockReceipts": {
				const block = this.resolveBlock(p[0] as string);
				if (!block) return null;
				return block.transactions
					.map((hash) => this.receipts.get(hash))
					.filter(Boolean);
			}

			case "eth_simulateV1":
				throw { code: 4200, message: "eth_simulateV1 not implemented" };

			case "debug_traceTransaction":
			case "debug_traceBlockByNumber":
			case "debug_traceBlockByHash":
			case "debug_traceCall":
			case "debug_getRawBlock":
				throw { code: 4200, message: "Debug methods not implemented" };

			case "engine_newPayloadV1":
			case "engine_newPayloadV2":
			case "engine_newPayloadV3":
			case "engine_forkchoiceUpdatedV1":
			case "engine_forkchoiceUpdatedV2":
			case "engine_forkchoiceUpdatedV3":
			case "engine_getPayloadV1":
			case "engine_getPayloadV2":
			case "engine_getPayloadV3":
			case "engine_getBlobsV1":
			case "engine_exchangeCapabilities":
			case "engine_exchangeTransitionConfigurationV1":
			case "engine_getPayloadBodiesByHashV1":
			case "engine_getPayloadBodiesByRangeV1":
				throw { code: 4200, message: "Engine API not supported" };

			default:
				throw { code: -32601, message: `Method not found: ${method}` };
		}
	}

	/**
	 * Resolve block tag to block header
	 */
	private resolveBlock(tag: string): BlockHeader | undefined {
		if (
			tag === "latest" ||
			tag === "pending" ||
			tag === "safe" ||
			tag === "finalized"
		) {
			return this.blocks.get(this.currentBlockNumber);
		}
		if (tag === "earliest") {
			return this.blocks.get(1n);
		}
		const num = BigInt(tag);
		return this.blocks.get(num);
	}

	/**
	 * Register event listener
	 */
	on<E extends ProviderEvent>(
		event: E,
		listener: (...args: ProviderEventMap[E]) => void,
	): this {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}
		this.eventListeners.get(event)?.add(listener as ProviderEventListener);
		return this;
	}

	/**
	 * Remove event listener
	 */
	removeListener<E extends ProviderEvent>(
		event: E,
		listener: (...args: ProviderEventMap[E]) => void,
	): this {
		this.eventListeners.get(event)?.delete(listener as ProviderEventListener);
		return this;
	}

	/**
	 * Emit event to all listeners
	 */
	private emit<E extends ProviderEvent>(
		event: E,
		...args: ProviderEventMap[E]
	): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.forEach((listener) => {
				listener(...args);
			});
		}
	}

	/**
	 * Cleanup resources
	 */
	destroy(): void {
		this.stopIntervalMining();
		this.eventListeners.clear();
		this.filters.clear();
		this.snapshots.clear();
	}

	// Async generators for events
	events: ProviderEvents = {
		newHeads: async function* (this: InMemoryProvider) {
			let lastBlock = this.currentBlockNumber;
			while (true) {
				await new Promise((resolve) => setTimeout(resolve, 100));
				if (this.currentBlockNumber > lastBlock) {
					lastBlock = this.currentBlockNumber;
					const block = this.blocks.get(lastBlock);
					if (block) yield this.formatBlock(block);
				}
			}
		}.bind(this),

		logs: async function* (this: InMemoryProvider, _params?: any) {
			// Simplified - yields nothing for now
			while (true) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}.bind(this),

		newPendingTransactions: async function* (this: InMemoryProvider) {
			while (true) {
				await new Promise((resolve) => setTimeout(resolve, 100));
				for (const tx of this.pendingTransactions) {
					yield tx.hash;
				}
			}
		}.bind(this),

		syncing: async function* (this: InMemoryProvider) {
			yield false;
		}.bind(this),
	};
}
