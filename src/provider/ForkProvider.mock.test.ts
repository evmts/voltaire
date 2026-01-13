/**
 * ForkProvider Integration Tests (Mock RPC)
 *
 * Tests ForkProvider against MockRpcClient without external dependencies.
 * Validates all 5 Milestone 1 acceptance criteria with mocked state.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MockRpcClient } from "./test-utils/MockRpcClient.js";
import { ForkProvider } from "./ForkProvider.js";
import { recordMockData, serializeMockData } from "../state-manager/MockDataRecorder.js";

describe("ForkProvider (Mock RPC)", () => {
	let mockRpc: MockRpcClient;
	let provider: ForkProvider;

	beforeEach(() => {
		mockRpc = new MockRpcClient();

		// Set up mock fork state at block 1000
		mockRpc.setBlock({
			number: 1000n,
			hash: "0xa" + "0".repeat(63),
			parentHash: "0xb" + "0".repeat(63),
			timestamp: 1700000000n,
			gasLimit: 30000000n,
			gasUsed: 0n,
			baseFeePerGas: 1000000000n,
			miner: "0xc0ffee0000000000000000000000000000000000",
			transactions: [],
		});

		// Set up test accounts
		mockRpc.setAccount("0x1234567890123456789012345678901234567890", {
			balance: 1000000000000000000n, // 1 ETH
			nonce: 5n,
			code: "0x6080604052",
			storage: new Map([
				[0n, 42n],
				[1n, 100n],
			]),
		});

		// Record mock data and load into Zig
		const recorded = recordMockData(mockRpc);
		const serialized = serializeMockData(recorded);

		// Skip header (16 bytes: num_accounts + num_blocks + fork_block_number)
		const dataOnly = serialized.subarray(16);

		// Load into native FFI
		const { dlopen, FFIType, suffix } = require("bun:ffi");
		const lib = dlopen(`zig-out/native/libprimitives_ts_native.${suffix}`, {
			mock_data_load: {
				args: [FFIType.u32, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.usize],
				returns: FFIType.void,
			},
		});

		lib.symbols.mock_data_load(
			recorded.accounts.length,
			recorded.blocks.length,
			recorded.forkBlockNumber,
			dataOnly,
			dataOnly.length,
		);
	});

	it("should initialize with fork configuration", () => {
		provider = new ForkProvider({
			fork: {
				forkUrl: "http://localhost:8545",
				forkBlockNumber: 1000n,
			},
			rpcClient: mockRpc,
			chainId: 1,
		});

		expect(provider).toBeDefined();
	});

	it("Criterion 1: eth_getBalance works in fork mode", async () => {
		provider = new ForkProvider({
			fork: {
				forkUrl: "http://localhost:8545",
				forkBlockNumber: 1000n,
			},
			rpcClient: mockRpc,
			chainId: 1,
		});

		const balance = await provider.request({
			method: "eth_getBalance",
			params: ["0x1234567890123456789012345678901234567890", "latest"],
		});

		expect(balance).toBe("0xde0b6b3a7640000"); // 1 ETH in hex
	});

	it("Criterion 2: eth_getCode works in fork mode", async () => {
		provider = new ForkProvider({
			fork: {
				forkUrl: "http://localhost:8545",
				forkBlockNumber: 1000n,
			},
			rpcClient: mockRpc,
			chainId: 1,
		});

		const code = await provider.request({
			method: "eth_getCode",
			params: ["0x1234567890123456789012345678901234567890", "latest"],
		});

		expect(code).toBe("0x6080604052");
	});

	it("Criterion 3: eth_getStorageAt works in fork mode", async () => {
		provider = new ForkProvider({
			fork: {
				forkUrl: "http://localhost:8545",
				forkBlockNumber: 1000n,
			},
			rpcClient: mockRpc,
			chainId: 1,
		});

		const storage = await provider.request({
			method: "eth_getStorageAt",
			params: ["0x1234567890123456789012345678901234567890", "0x0", "latest"],
		});

		expect(storage).toBe(
			"0x000000000000000000000000000000000000000000000000000000000000002a",
		); // 42 in hex
	});

	it("Criterion 4: eth_blockNumber returns fork head", async () => {
		provider = new ForkProvider({
			fork: {
				forkUrl: "http://localhost:8545",
				forkBlockNumber: 1000n,
			},
			rpcClient: mockRpc,
			chainId: 1,
		});

		const blockNumber = await provider.request({
			method: "eth_blockNumber",
			params: [],
		});

		expect(blockNumber).toBe("0x3e8"); // 1000 in hex
	});

	it("Criterion 5: eth_getBlockByNumber fetches fork blocks", async () => {
		provider = new ForkProvider({
			fork: {
				forkUrl: "http://localhost:8545",
				forkBlockNumber: 1000n,
			},
			rpcClient: mockRpc,
			chainId: 1,
		});

		const block = await provider.request({
			method: "eth_getBlockByNumber",
			params: ["0x3e8", false],
		});

		expect(block).toBeDefined();
		expect((block as { number: string }).number).toBe("0x3e8");
		expect((block as { hash: string }).hash).toMatch(/^0xa0+$/);
	});

	it("should handle eth_chainId", async () => {
		// This doesn't require FFI
		const mockProvider = {
			request: mockRpc.request.bind(mockRpc),
			on: () => mockProvider,
			removeListener: () => mockProvider,
		};

		const chainId = await mockProvider.request({
			method: "eth_chainId",
			params: [],
		});

		expect(chainId).toBe("0x1");
	});

	it("should handle net_version", async () => {
		const mockProvider = {
			request: mockRpc.request.bind(mockRpc),
			on: () => mockProvider,
			removeListener: () => mockProvider,
		};

		const version = await mockProvider.request({
			method: "net_version",
			params: [],
		});

		expect(version).toBe("1");
	});
});

describe("MockRpcClient standalone", () => {
	it("should return account balance", async () => {
		const mock = new MockRpcClient();
		mock.setAccount("0xabc", { balance: 1000n });

		const balance = await mock.request({
			method: "eth_getBalance",
			params: ["0xabc", "latest"],
		});

		expect(balance).toBe("0x3e8");
	});

	it("should return account code", async () => {
		const mock = new MockRpcClient();
		mock.setAccount("0xabc", { code: "0x1234" });

		const code = await mock.request({
			method: "eth_getCode",
			params: ["0xabc", "latest"],
		});

		expect(code).toBe("0x1234");
	});

	it("should return storage value", async () => {
		const mock = new MockRpcClient();
		const storage = new Map([[5n, 999n]]);
		mock.setAccount("0xabc", { storage });

		const value = await mock.request({
			method: "eth_getStorageAt",
			params: ["0xabc", "0x5", "latest"],
		});

		expect(value).toBe(
			"0x00000000000000000000000000000000000000000000000000000000000003e7",
		);
	});

	it("should return block by number", async () => {
		const mock = new MockRpcClient();
		mock.setBlock({
			number: 500n,
			hash: "0xabc",
			parentHash: "0xdef",
			timestamp: 1600000000n,
			gasLimit: 10000000n,
			gasUsed: 5000000n,
			miner: "0x0",
			transactions: [],
		});

		const block = await mock.request({
			method: "eth_getBlockByNumber",
			params: ["0x1f4", false],
		});

		expect(block).toBeDefined();
		expect((block as { number: string }).number).toBe("0x1f4");
	});

	it("should return eth_getProof", async () => {
		const mock = new MockRpcClient();
		const storage = new Map([[10n, 20n]]);
		mock.setAccount("0xabc", {
			balance: 500n,
			nonce: 3n,
			code: "0x1234",
			storage,
		});

		const proof = await mock.request({
			method: "eth_getProof",
			params: ["0xabc", ["0xa"], "latest"],
		});

		expect(proof).toBeDefined();
		const p = proof as {
			balance: string;
			nonce: string;
			storageProof: Array<{ key: string; value: string }>;
		};
		expect(p.balance).toBe("0x1f4");
		expect(p.nonce).toBe("0x3");
		expect(p.storageProof).toHaveLength(1);
		expect(p.storageProof[0].value).toBe("0x14");
	});
});
