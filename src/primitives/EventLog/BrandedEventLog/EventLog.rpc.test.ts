import { describe, expect, it } from "vitest";
import { create, from } from "./index.js";
import * as Address from "../../../Address/index.js";
import * as Hash from "../../../Hash/index.js";

describe("EventLog - RPC Response Parsing", () => {
	describe("from", () => {
		it("parses standard RPC log response", () => {
			const rpcLog = {
				address: "0x0000000000000000000000000000000000000001",
				topics: [
					"0x0000000000000000000000000000000000000000000000000000000000000010",
					"0x0000000000000000000000000000000000000000000000000000000000000011",
				],
				data: "0x0102030405",
				blockNumber: "0x64",
				transactionHash:
					"0x0000000000000000000000000000000000000000000000000000000000000200",
				transactionIndex: "0x5",
				blockHash:
					"0x0000000000000000000000000000000000000000000000000000000000000100",
				logIndex: "0xa",
				removed: false,
			};

			const log = from(rpcLog);

			expect(log.blockNumber).toBe(100n);
			expect(log.transactionIndex).toBe(5);
			expect(log.logIndex).toBe(10);
			expect(log.removed).toBe(false);
		});

		it("parses log with hex number strings", () => {
			const rpcLog = {
				address: "0x0000000000000000000000000000000000000001",
				topics: [
					"0x0000000000000000000000000000000000000000000000000000000000000010",
				],
				data: "0x",
				blockNumber: "0xff",
				transactionIndex: "0x10",
				logIndex: "0x1",
			};

			const log = from(rpcLog);

			expect(log.blockNumber).toBe(255n);
			expect(log.transactionIndex).toBe(16);
			expect(log.logIndex).toBe(1);
		});

		it("parses log with decimal number strings", () => {
			const rpcLog = {
				address: "0x0000000000000000000000000000000000000001",
				topics: [
					"0x0000000000000000000000000000000000000000000000000000000000000010",
				],
				data: "0x",
				blockNumber: "100",
				transactionIndex: "5",
				logIndex: "10",
			};

			const log = from(rpcLog);

			expect(log.blockNumber).toBe(100n);
			expect(log.transactionIndex).toBe(5);
			expect(log.logIndex).toBe(10);
		});

		it("handles missing optional fields", () => {
			const rpcLog = {
				address: "0x0000000000000000000000000000000000000001",
				topics: [
					"0x0000000000000000000000000000000000000000000000000000000000000010",
				],
				data: "0x",
			};

			const log = from(rpcLog);

			expect(log.blockNumber).toBeUndefined();
			expect(log.transactionHash).toBeUndefined();
			expect(log.transactionIndex).toBeUndefined();
			expect(log.blockHash).toBeUndefined();
			expect(log.logIndex).toBeUndefined();
			expect(log.removed).toBe(false);
		});

		it("parses empty data field", () => {
			const rpcLog = {
				address: "0x0000000000000000000000000000000000000001",
				topics: [
					"0x0000000000000000000000000000000000000000000000000000000000000010",
				],
				data: "0x",
			};

			const log = from(rpcLog);
			expect(log.data).toEqual(new Uint8Array(0));
		});

		it("parses long data field", () => {
			const rpcLog = {
				address: "0x0000000000000000000000000000000000000001",
				topics: [
					"0x0000000000000000000000000000000000000000000000000000000000000010",
				],
				data: `0x${"00".repeat(1000)}`,
			};

			const log = from(rpcLog);
			expect(log.data.length).toBe(1000);
		});

		it("handles removed logs", () => {
			const rpcLog = {
				address: "0x0000000000000000000000000000000000000001",
				topics: [
					"0x0000000000000000000000000000000000000000000000000000000000000010",
				],
				data: "0x",
				removed: true,
			};

			const log = from(rpcLog);
			expect(log.removed).toBe(true);
		});
	});
});

describe("EventLog - Anonymous Events", () => {
	it("creates anonymous event (no signature topic)", () => {
		const log = create({
			address: Address.from("0x0000000000000000000000000000000000000001"),
			topics: [],
			data: new Uint8Array([1, 2, 3, 4]),
		});

		expect(log.topics.length).toBe(0);
		expect(log.data.length).toBe(4);
	});

	it("anonymous event has no topic0", () => {
		const log = create({
			address: Address.from("0x0000000000000000000000000000000000000001"),
			topics: [],
			data: new Uint8Array([1, 2, 3]),
		});

		const topic0 = log.topics[0];
		expect(topic0).toBeUndefined();
	});

	it("anonymous event with indexed parameters", () => {
		const log = create({
			address: Address.from("0x0000000000000000000000000000000000000001"),
			topics: [
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000001",
				),
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000002",
				),
			],
			data: new Uint8Array([1, 2, 3]),
		});

		expect(log.topics.length).toBe(2);
	});
});

describe("EventLog - ERC20 Transfer Event", () => {
	const transferSignature = Hash.from(
		"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
	);

	it("creates ERC20 Transfer log", () => {
		const from = "0x0000000000000000000000000000000000000001";
		const to = "0x0000000000000000000000000000000000000002";
		const amount = new Uint8Array(32);
		amount[31] = 100;

		const log = create({
			address: Address.from("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
			topics: [
				transferSignature,
				Hash.from(
					`0x000000000000000000000000${from.slice(2)}`,
				),
				Hash.from(
					`0x000000000000000000000000${to.slice(2)}`,
				),
			],
			data: amount,
			blockNumber: 18000000n,
			transactionIndex: 50,
			logIndex: 100,
		});

		expect(log.topics.length).toBe(3);
		expect(log.topics[0]).toBe(transferSignature);
		expect(log.data.length).toBe(32);
		expect(log.data[31]).toBe(100);
	});

	it("parses Transfer event from RPC", () => {
		const rpcLog = {
			address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
			topics: [
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
				"0x0000000000000000000000000000000000000000000000000000000000000001",
				"0x0000000000000000000000000000000000000000000000000000000000000002",
			],
			data: "0x0000000000000000000000000000000000000000000000000000000000000064",
			blockNumber: "0x112a880",
			transactionIndex: "0x32",
			logIndex: "0x64",
		};

		const log = from(rpcLog);

		expect(log.topics[0]).toBe(transferSignature);
		expect(log.blockNumber).toBe(18000000n);
		expect(log.transactionIndex).toBe(50);
		expect(log.logIndex).toBe(100);
	});
});

describe("EventLog - ERC721 Transfer Event", () => {
	const transferSignature = Hash.from(
		"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
	);

	it("creates ERC721 Transfer log", () => {
		const from = "0x0000000000000000000000000000000000000001";
		const to = "0x0000000000000000000000000000000000000002";
		const tokenId = Hash.from(
			"0x0000000000000000000000000000000000000000000000000000000000000123",
		);

		const log = create({
			address: Address.from("0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"),
			topics: [
				transferSignature,
				Hash.from(
					`0x000000000000000000000000${from.slice(2)}`,
				),
				Hash.from(
					`0x000000000000000000000000${to.slice(2)}`,
				),
				tokenId,
			],
			data: new Uint8Array(0),
			blockNumber: 18000000n,
		});

		expect(log.topics.length).toBe(4);
		expect(log.topics[3]).toBe(tokenId);
		expect(log.data.length).toBe(0);
	});
});

describe("EventLog - Maximum Topics", () => {
	it("handles event with 4 topics (max for Solidity)", () => {
		const log = create({
			address: Address.from("0x0000000000000000000000000000000000000001"),
			topics: [
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000001",
				),
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000002",
				),
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000003",
				),
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000004",
				),
			],
			data: new Uint8Array([1, 2, 3]),
		});

		expect(log.topics.length).toBe(4);
	});

	it("signature + 3 indexed parameters", () => {
		const log = create({
			address: Address.from("0x0000000000000000000000000000000000000001"),
			topics: [
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000010",
				),
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000011",
				),
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000012",
				),
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000013",
				),
			],
			data: new Uint8Array(64),
		});

		expect(log.topics[0]).toBeDefined();
		expect(log.topics[1]).toBeDefined();
		expect(log.topics[2]).toBeDefined();
		expect(log.topics[3]).toBeDefined();
	});
});

describe("EventLog - Large Data Fields", () => {
	it("handles 32-byte data (single uint256)", () => {
		const data = new Uint8Array(32);
		data[31] = 0xff;

		const log = create({
			address: Address.from("0x0000000000000000000000000000000000000001"),
			topics: [
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000010",
				),
			],
			data,
		});

		expect(log.data.length).toBe(32);
		expect(log.data[31]).toBe(0xff);
	});

	it("handles 64-byte data (two uint256)", () => {
		const data = new Uint8Array(64);
		data[31] = 1;
		data[63] = 2;

		const log = create({
			address: Address.from("0x0000000000000000000000000000000000000001"),
			topics: [
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000010",
				),
			],
			data,
		});

		expect(log.data.length).toBe(64);
		expect(log.data[31]).toBe(1);
		expect(log.data[63]).toBe(2);
	});

	it("handles dynamic-length data (string/bytes)", () => {
		const data = new Uint8Array(96);
		data[31] = 0x20;
		data[63] = 0x05;
		data[64] = 0x68;
		data[65] = 0x65;
		data[66] = 0x6c;
		data[67] = 0x6c;
		data[68] = 0x6f;

		const log = create({
			address: Address.from("0x0000000000000000000000000000000000000001"),
			topics: [
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000010",
				),
			],
			data,
		});

		expect(log.data.length).toBe(96);
	});

	it("handles very large data (> 1KB)", () => {
		const data = new Uint8Array(2000);
		for (let i = 0; i < data.length; i++) {
			data[i] = i % 256;
		}

		const log = create({
			address: Address.from("0x0000000000000000000000000000000000000001"),
			topics: [
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000010",
				),
			],
			data,
		});

		expect(log.data.length).toBe(2000);
	});
});

describe("EventLog - Block Number Edge Cases", () => {
	it("handles block 0 (genesis)", () => {
		const log = create({
			address: Address.from("0x0000000000000000000000000000000000000001"),
			topics: [
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000010",
				),
			],
			data: new Uint8Array(0),
			blockNumber: 0n,
		});

		expect(log.blockNumber).toBe(0n);
	});

	it("handles very large block numbers", () => {
		const largeBlock = 999_999_999_999n;

		const log = create({
			address: Address.from("0x0000000000000000000000000000000000000001"),
			topics: [
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000010",
				),
			],
			data: new Uint8Array(0),
			blockNumber: largeBlock,
		});

		expect(log.blockNumber).toBe(largeBlock);
	});

	it("handles current mainnet block numbers", () => {
		const log = create({
			address: Address.from("0x0000000000000000000000000000000000000001"),
			topics: [
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000010",
				),
			],
			data: new Uint8Array(0),
			blockNumber: 18_000_000n,
		});

		expect(log.blockNumber).toBe(18_000_000n);
	});
});

describe("EventLog - Chain Reorganization", () => {
	it("marks log as removed", () => {
		const log = create({
			address: Address.from("0x0000000000000000000000000000000000000001"),
			topics: [
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000010",
				),
			],
			data: new Uint8Array([1, 2, 3]),
			removed: true,
		});

		expect(log.removed).toBe(true);
	});

	it("defaults to not removed", () => {
		const log = create({
			address: Address.from("0x0000000000000000000000000000000000000001"),
			topics: [
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000010",
				),
			],
			data: new Uint8Array([1, 2, 3]),
		});

		expect(log.removed).toBe(false);
	});
});

describe("EventLog - Real-World Addresses", () => {
	it("handles USDC contract logs", () => {
		const log = create({
			address: Address.from("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
			topics: [
				Hash.from(
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
				),
			],
			data: new Uint8Array(32),
		});

		expect(log.address).toBeDefined();
	});

	it("handles Uniswap V2 Pair logs", () => {
		const log = create({
			address: Address.from("0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc"),
			topics: [
				Hash.from(
					"0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1",
				),
			],
			data: new Uint8Array(128),
		});

		expect(log.address).toBeDefined();
	});

	it("handles BAYC contract logs", () => {
		const log = create({
			address: Address.from("0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"),
			topics: [
				Hash.from(
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
				),
			],
			data: new Uint8Array(0),
		});

		expect(log.address).toBeDefined();
	});
});
