import { describe, expect, it } from "vitest";
import * as BlockBody from "../BlockBody/index.js";
import * as BlockHeader from "../BlockHeader/index.js";
import * as Block from "./index.js";

describe("Block", () => {
	const validHeader = {
		parentHash: new Uint8Array(32).fill(0x12),
		ommersHash: new Uint8Array(32).fill(0x34),
		beneficiary: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		stateRoot: new Uint8Array(32).fill(0x56),
		transactionsRoot: new Uint8Array(32).fill(0x78),
		receiptsRoot: new Uint8Array(32).fill(0x9a),
		logsBloom: new Uint8Array(256),
		difficulty: 0n,
		number: 12345n,
		gasLimit: 30000000n,
		gasUsed: 21000n,
		timestamp: 1234567890n,
		extraData: new Uint8Array(0),
		mixHash: new Uint8Array(32).fill(0xbc),
		nonce: new Uint8Array(8),
	};

	// Real-world RPC response example (Cancun block)
	const rpcBlockResponse = {
		hash: "0xe27a3e81bd7cfe2aec2cc9e832c73a17c93e7efcf659cf4b39883b96c48708c2",
		parentHash:
			"0x4b9d85c6787612e87e0659e11a347d415040465e492358f79cc7e2e293f38aa7",
		sha3Uncles:
			"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
		miner: "0x0000000000000000000000000000000000000000",
		stateRoot:
			"0xf61892bbb9a9df427d1f941dc8c536d72c41efed598244726ea21a0f183ff232",
		transactionsRoot:
			"0xc541c333ff4a96a17d3601f7d628ea27ecf4597a11077e5d9d1c4dbed6c7f401",
		receiptsRoot:
			"0x2c86b2791cdd088d3c3e9d6225f71724d3e8c67bdd13cd6208831058cee1043f",
		logsBloom:
			"0x00000000008000000000000000000040000000000000000000000000800000000000000008000000000000000000000000000000000000000000000000000000000000000000000000004000000000020200000000000000000000000000002000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000009000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
		difficulty: "0x0",
		number: "0x2d",
		gasLimit: "0x47e7c40",
		gasUsed: "0x54a92",
		timestamp: "0x1c2",
		extraData: "0x",
		mixHash:
			"0x0000000000000000000000000000000000000000000000000000000000000000",
		nonce: "0x0000000000000000",
		baseFeePerGas: "0x5763d64",
		size: "0x633",
		totalDifficulty: "0x0",
		blobGasUsed: "0x0",
		excessBlobGas: "0x0",
		parentBeaconBlockRoot:
			"0x4b118bd31ed2c4eeb81dc9e3919e9989994333fe36f147c2930f12c53f0d3c78",
		withdrawalsRoot:
			"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
		transactions: [],
		uncles: [],
		withdrawals: [],
	};

	const validBody = {
		transactions: [],
		ommers: [],
	};

	const validHash = new Uint8Array(32).fill(0xab);

	describe("from", () => {
		it("creates block from components", () => {
			const header = BlockHeader.from(validHeader);
			const body = BlockBody.from(validBody);

			const block = Block.from({
				header,
				body,
				hash: validHash,
				size: 1024n,
			});

			expect(block.header).toBe(header);
			expect(block.body).toBe(body);
			expect(block.hash).toHaveLength(32);
			expect(block.size).toBe(1024n);
			expect(block.totalDifficulty).toBeUndefined();
		});

		it("includes optional totalDifficulty", () => {
			const header = BlockHeader.from(validHeader);
			const body = BlockBody.from(validBody);

			const block = Block.from({
				header,
				body,
				hash: validHash,
				size: 1024n,
				totalDifficulty: 12345678n,
			});

			expect(block.totalDifficulty).toBe(12345678n);
		});

		it("converts hash from string", () => {
			const header = BlockHeader.from(validHeader);
			const body = BlockBody.from(validBody);

			const block = Block.from({
				header,
				body,
				hash: "0xabababababababababababababababababababababababababababababababab",
				size: 1024n,
			});

			expect(block.hash).toHaveLength(32);
		});

		it("converts size from number", () => {
			const header = BlockHeader.from(validHeader);
			const body = BlockBody.from(validBody);

			const block = Block.from({
				header,
				body,
				hash: validHash,
				size: 1024,
			});

			expect(block.size).toBe(1024n);
		});

		it("creates post-merge block without totalDifficulty", () => {
			const header = BlockHeader.from({
				...validHeader,
				difficulty: 0n,
			});
			const body = BlockBody.from(validBody);

			const block = Block.from({
				header,
				body,
				hash: validHash,
				size: 1024n,
			});

			expect(block.header.difficulty).toBe(0n);
			expect(block.totalDifficulty).toBeUndefined();
		});
	});

	describe("fromRpc", () => {
		it("parses block from RPC response", () => {
			const block = Block.fromRpc(rpcBlockResponse);

			expect(block.hash).toHaveLength(32);
			expect(block.header.number).toBe(0x2dn);
			expect(block.header.gasLimit).toBe(0x47e7c40n);
			expect(block.header.gasUsed).toBe(0x54a92n);
			expect(block.header.timestamp).toBe(0x1c2n);
			expect(block.header.difficulty).toBe(0n);
			expect(block.size).toBe(0x633n);
			expect(block.totalDifficulty).toBe(0n);
			expect(block.body.transactions).toHaveLength(0);
			expect(block.body.ommers).toHaveLength(0);
		});

		it("parses EIP-1559 fields", () => {
			const block = Block.fromRpc(rpcBlockResponse);

			expect(block.header.baseFeePerGas).toBe(0x5763d64n);
		});

		it("parses EIP-4844 fields", () => {
			const block = Block.fromRpc(rpcBlockResponse);

			expect(block.header.blobGasUsed).toBe(0n);
			expect(block.header.excessBlobGas).toBe(0n);
			expect(block.header.parentBeaconBlockRoot).toHaveLength(32);
		});

		it("parses withdrawals root", () => {
			const block = Block.fromRpc(rpcBlockResponse);

			expect(block.header.withdrawalsRoot).toHaveLength(32);
		});

		it("handles null optional fields", () => {
			const rpcWithNulls = {
				...rpcBlockResponse,
				baseFeePerGas: null,
				withdrawalsRoot: null,
				blobGasUsed: null,
				excessBlobGas: null,
				parentBeaconBlockRoot: null,
				totalDifficulty: null,
			};

			const block = Block.fromRpc(rpcWithNulls);

			expect(block.header.baseFeePerGas).toBeUndefined();
			expect(block.header.withdrawalsRoot).toBeUndefined();
			expect(block.header.blobGasUsed).toBeUndefined();
			expect(block.header.excessBlobGas).toBeUndefined();
			expect(block.header.parentBeaconBlockRoot).toBeUndefined();
			expect(block.totalDifficulty).toBeUndefined();
		});

		it("handles pre-London block (no baseFeePerGas)", () => {
			const preLondonRpc = {
				hash: "0xe27a3e81bd7cfe2aec2cc9e832c73a17c93e7efcf659cf4b39883b96c48708c2",
				parentHash:
					"0x4b9d85c6787612e87e0659e11a347d415040465e492358f79cc7e2e293f38aa7",
				sha3Uncles:
					"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
				miner: "0x0000000000000000000000000000000000000000",
				stateRoot:
					"0xf61892bbb9a9df427d1f941dc8c536d72c41efed598244726ea21a0f183ff232",
				transactionsRoot:
					"0xc541c333ff4a96a17d3601f7d628ea27ecf4597a11077e5d9d1c4dbed6c7f401",
				receiptsRoot:
					"0x2c86b2791cdd088d3c3e9d6225f71724d3e8c67bdd13cd6208831058cee1043f",
				logsBloom:
					"0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
				difficulty: "0x1234567890",
				number: "0x2d",
				gasLimit: "0x47e7c40",
				gasUsed: "0x54a92",
				timestamp: "0x1c2",
				extraData: "0x",
				mixHash:
					"0x0000000000000000000000000000000000000000000000000000000000000000",
				nonce: "0x0000000000000000",
				size: "0x633",
				totalDifficulty: "0x9876543210",
			};

			const block = Block.fromRpc(preLondonRpc);

			expect(block.header.difficulty).toBe(0x1234567890n);
			expect(block.totalDifficulty).toBe(0x9876543210n);
			expect(block.header.baseFeePerGas).toBeUndefined();
		});

		it("parses block with withdrawals", () => {
			const rpcWithWithdrawals = {
				...rpcBlockResponse,
				withdrawals: [
					{
						index: "0x1",
						validatorIndex: "0x2",
						address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
						amount: "0x3b9aca00",
					},
					{
						index: "0x2",
						validatorIndex: "0x3",
						address: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
						amount: "0x77359400",
					},
				],
			};

			const block = Block.fromRpc(rpcWithWithdrawals);

			expect(block.body.withdrawals).toHaveLength(2);
			// WithdrawalIndex is bigint, ValidatorIndex is number, amount is string (Gwei)
			expect(block.body.withdrawals?.[0].index).toBe(1n);
			expect(block.body.withdrawals?.[0].validatorIndex).toBe(2);
			expect(block.body.withdrawals?.[0].amount).toBe("1000000000"); // 0x3b9aca00 = 1000000000
			expect(block.body.withdrawals?.[1].index).toBe(2n);
			expect(block.body.withdrawals?.[1].validatorIndex).toBe(3);
			expect(block.body.withdrawals?.[1].amount).toBe("2000000000"); // 0x77359400 = 2000000000
		});

		it("parses block with transactions", () => {
			const rpcWithTxs = {
				...rpcBlockResponse,
				transactions: [
					{
						blockHash:
							"0xe27a3e81bd7cfe2aec2cc9e832c73a17c93e7efcf659cf4b39883b96c48708c2",
						blockNumber: "0x2d",
						from: "0x7435ed30a8b4aeb0877cef0c6e8cffe834eb865f",
						gas: "0x11c32",
						gasPrice: "0x5763d65",
						hash: "0x2fbbd036996c7487316c92b9e5798edb98fd57f32a6c1075e904a734821e1cd2",
						input: "0x",
						nonce: "0x9a",
						to: "0x0000000000000000000000000000000000000000",
						transactionIndex: "0x0",
						value: "0x0",
						type: "0x0",
						chainId: "0xc72dd9d5e883e",
						v: "0x18e5bb3abd109f",
						r: "0x551fe45ccebb0318196e31dbc60da87c43dc60b8fb01afb3286693fa09878730",
						s: "0x40d33e9afecfe1516b045d61a3272bddbc83f482a7f2c749311248b50fe62e81",
					},
				],
			};

			const block = Block.fromRpc(rpcWithTxs);

			expect(block.body.transactions).toHaveLength(1);
			expect(block.body.transactions[0].nonce).toBe(0x9an);
			expect(block.body.transactions[0].gasLimit).toBe(0x11c32n);
		});

		it("handles transaction hashes (includeTransactions=false)", () => {
			const rpcWithTxHashes = {
				...rpcBlockResponse,
				transactions: [
					"0x2fbbd036996c7487316c92b9e5798edb98fd57f32a6c1075e904a734821e1cd2",
					"0x16f6724ad864e7664c367893cae3e176d362bea3a47495cec3b246555a7228da",
				],
			};

			const block = Block.fromRpc(rpcWithTxHashes, {
				includeTransactions: false,
			});

			// When transactions are hashes, we don't parse them
			expect(block.body.transactions).toHaveLength(0);
		});

		it("parses logsBloom correctly", () => {
			const block = Block.fromRpc(rpcBlockResponse);

			expect(block.header.logsBloom).toBeInstanceOf(Uint8Array);
			expect(block.header.logsBloom).toHaveLength(256);
		});

		it("parses nonce correctly", () => {
			const block = Block.fromRpc(rpcBlockResponse);

			expect(block.header.nonce).toBeInstanceOf(Uint8Array);
			expect(block.header.nonce).toHaveLength(8);
		});

		it("parses extraData correctly", () => {
			const rpcWithExtraData = {
				...rpcBlockResponse,
				extraData:
					"0x6265617665726275696c642e6f7267", // "beaverbuild.org" in hex
			};

			const block = Block.fromRpc(rpcWithExtraData);

			expect(block.header.extraData).toBeInstanceOf(Uint8Array);
			expect(block.header.extraData).toHaveLength(15);
		});

		it("maps RPC field names to internal names", () => {
			const block = Block.fromRpc(rpcBlockResponse);

			// sha3Uncles -> ommersHash
			expect(block.header.ommersHash).toHaveLength(32);
			// miner -> beneficiary
			expect(block.header.beneficiary).toHaveLength(20);
		});
	});
});
