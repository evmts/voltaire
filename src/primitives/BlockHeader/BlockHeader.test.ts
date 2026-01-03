import { describe, expect, it } from "vitest";
import { toBytes } from "../Hex/toBytes.js";
import * as BlockHeader from "./index.js";

describe("BlockHeader", () => {
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

	describe("from", () => {
		it("creates header from basic components", () => {
			const header = BlockHeader.from(validHeader);

			expect(header.parentHash).toHaveLength(32);
			expect(header.ommersHash).toHaveLength(32);
			expect(header.beneficiary).toHaveLength(20);
			expect(header.stateRoot).toHaveLength(32);
			expect(header.transactionsRoot).toHaveLength(32);
			expect(header.receiptsRoot).toHaveLength(32);
			expect(header.logsBloom).toHaveLength(256);
			expect(header.difficulty).toBe(0n);
			expect(header.number).toBe(12345n);
			expect(header.gasLimit).toBe(30000000n);
			expect(header.gasUsed).toBe(21000n);
			expect(header.timestamp).toBe(1234567890n);
			expect(header.extraData).toHaveLength(0);
			expect(header.mixHash).toHaveLength(32);
			expect(header.nonce).toHaveLength(8);
		});

		it("includes optional EIP-1559 fields", () => {
			const header = BlockHeader.from({
				...validHeader,
				baseFeePerGas: 1000000000n,
			});

			expect(header.baseFeePerGas).toBe(1000000000n);
		});

		it("includes optional post-Shanghai fields", () => {
			const header = BlockHeader.from({
				...validHeader,
				withdrawalsRoot: new Uint8Array(32).fill(0xde),
			});

			expect(header.withdrawalsRoot).toHaveLength(32);
		});

		it("includes optional EIP-4844 fields", () => {
			const header = BlockHeader.from({
				...validHeader,
				blobGasUsed: 262144n,
				excessBlobGas: 0n,
			});

			expect(header.blobGasUsed).toBe(262144n);
			expect(header.excessBlobGas).toBe(0n);
		});

		it("includes optional EIP-4788 fields", () => {
			const header = BlockHeader.from({
				...validHeader,
				parentBeaconBlockRoot: new Uint8Array(32).fill(0x01),
			});

			expect(header.parentBeaconBlockRoot).toHaveLength(32);
		});

		it("handles all optional fields together", () => {
			const header = BlockHeader.from({
				...validHeader,
				baseFeePerGas: 1000000000n,
				withdrawalsRoot: new Uint8Array(32).fill(0xde),
				blobGasUsed: 262144n,
				excessBlobGas: 0n,
				parentBeaconBlockRoot: new Uint8Array(32).fill(0x01),
			});

			expect(header.baseFeePerGas).toBe(1000000000n);
			expect(header.withdrawalsRoot).toHaveLength(32);
			expect(header.blobGasUsed).toBe(262144n);
			expect(header.excessBlobGas).toBe(0n);
			expect(header.parentBeaconBlockRoot).toHaveLength(32);
		});

		it("converts number inputs", () => {
			const header = BlockHeader.from({
				...validHeader,
				number: 12345,
				gasLimit: 30000000,
				gasUsed: 21000,
				timestamp: 1234567890,
			});

			expect(header.number).toBe(12345n);
			expect(header.gasLimit).toBe(30000000n);
			expect(header.gasUsed).toBe(21000n);
			expect(header.timestamp).toBe(1234567890n);
		});
	});

	describe("calculateHash", () => {
		// Real mainnet block 20,000,000 (PoS, Cancun fork)
		// https://etherscan.io/block/20000000
		const block20000000 = {
			parentHash:
				"0xb390d63aac03bbef75de888d16bd56b91c9291c2a7e38d36ac24731351522bd1",
			// Empty uncles hash (PoS)
			ommersHash:
				"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
			beneficiary: "0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5",
			stateRoot:
				"0x68421c2c599dc31396a09772a073fb421c4bd25ef1462914ef13e5dfa2d31c23",
			transactionsRoot:
				"0xf0280ae7fd02f2b9684be8d740830710cd62e4869c891c3a0ead32ea757e70a3",
			receiptsRoot:
				"0xb39f9f7a13a342751bd2c575eca303e224393d4e11d715866b114b7e824da608",
			logsBloom: toBytes(
				"0x94a9480614840b245a1a2148e2100e2070472151b44c3020280930809a20c011609520bc10080074a61c782411e34713ee19c560ca02208f4770080013bc5d302d84743dd0008c5d089d5b1c95940de80809888ba7ed68512d426c048934c8cc0a08dd440b461265001ee50909a26d0213000a7411242c72a648c87e104c0097a0aaba477628508533c5924867341dd11305aa372350b019244034dc849419968b00fd2dda39ecff042639c43923f0d48495d2a40468524bce13a86444c82071ca9c431208870b33f5320f680f3991c2349e2433c80440b0832016820e1070a4405aadcc40050a5006c24504f0098c4391e0f04047c824d1d88ca8021d240510",
			),
			difficulty: 0n, // PoS
			number: 20000000n, // 0x1312d00
			gasLimit: 30000000n, // 0x1c9c380
			gasUsed: 11089692n, // 0xa9371c
			timestamp: 1717281407n, // 0x665ba27f
			extraData: toBytes("0x6265617665726275696c642e6f7267"), // "beaverbuild.org"
			mixHash:
				"0x85175443c2889afcb52288e0fa8804b671e582f9fd416071a70642d90c7dc0db",
			nonce: toBytes("0x0000000000000000"), // PoS nonce is 0
			baseFeePerGas: 4936957716n, // 0x12643ff14
			withdrawalsRoot:
				"0xf0747de0368fb967ede9b81320a5b01a4d85b3d427e8bc8e96ff371478d80e76",
			blobGasUsed: 131072n, // 0x20000
			excessBlobGas: 0n,
			parentBeaconBlockRoot:
				"0xec0befcffe8b2792fc5e7b67dac85ee3bbb09bc56b0ea5d9a698ec3b402d296f",
		};

		const expectedHash20000000 =
			"0xd24fd73f794058a3807db926d8898c6481e902b7edb91ce0d479d6760f276183";

		it("calculates hash for PoS block (Cancun fork, block 20,000,000)", () => {
			const header = BlockHeader.from(block20000000);
			const hash = BlockHeader.calculateHash(header);

			// Convert to hex for comparison
			const hashHex =
				"0x" +
				Array.from(hash)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("");

			expect(hashHex).toBe(expectedHash20000000);
		});

		it("produces consistent RLP encoding", () => {
			const header = BlockHeader.from(block20000000);
			const rlp = BlockHeader.toRlp(header);

			// RLP should be non-empty
			expect(rlp.length).toBeGreaterThan(0);

			// First byte should indicate a list (0xf8 or 0xf9 for long lists)
			expect(rlp[0]).toBeGreaterThanOrEqual(0xf8);
		});

		it("handles PoS blocks (difficulty=0, nonce=0)", () => {
			const header = BlockHeader.from({
				...validHeader,
				difficulty: 0n,
				nonce: new Uint8Array(8), // All zeros
				baseFeePerGas: 1000000000n,
			});

			const hash = BlockHeader.calculateHash(header);
			expect(hash).toHaveLength(32);
		});

		it("handles pre-merge PoW blocks (no optional fields)", () => {
			const header = BlockHeader.from({
				...validHeader,
				difficulty: 12345678901234n, // Non-zero difficulty
				nonce: new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]),
			});

			const hash = BlockHeader.calculateHash(header);
			expect(hash).toHaveLength(32);
		});

		it("handles London fork blocks (with baseFeePerGas)", () => {
			const header = BlockHeader.from({
				...validHeader,
				baseFeePerGas: 7n,
			});

			const hash = BlockHeader.calculateHash(header);
			expect(hash).toHaveLength(32);
		});

		it("handles Shanghai fork blocks (with withdrawalsRoot)", () => {
			const header = BlockHeader.from({
				...validHeader,
				baseFeePerGas: 7n,
				withdrawalsRoot: new Uint8Array(32).fill(0xab),
			});

			const hash = BlockHeader.calculateHash(header);
			expect(hash).toHaveLength(32);
		});
	});
});
