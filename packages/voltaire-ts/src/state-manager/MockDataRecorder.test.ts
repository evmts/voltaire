import { describe, expect, it } from "vitest";
import { MockRpcClient } from "../provider/test-utils/MockRpcClient.js";
import {
	type RecordedData,
	recordMockData,
	serializeMockData,
} from "./MockDataRecorder.js";

function readBigEndianU256(bytes: Uint8Array, offset: number): bigint {
	let result = 0n;
	for (let i = 0; i < 32; i++) {
		result = (result << 8n) | BigInt(bytes[offset + i] ?? 0);
	}
	return result;
}

function bytesToHex(bytes: Uint8Array): string {
	return `0x${Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

describe("MockDataRecorder", () => {
	describe("recordMockData", () => {
		it("records empty MockRpcClient state", () => {
			const mockRpc = new MockRpcClient();
			const recorded = recordMockData(mockRpc);

			expect(recorded).toEqual({
				accounts: [],
				blocks: [],
				forkBlockNumber: 0n,
			});
		});

		it("records multiple accounts with balances, nonces, code, and storage slots", () => {
			const mockRpc = new MockRpcClient();
			const aliceAddr = "0x1111111111111111111111111111111111111111";
			const contractAddr = "0x2222222222222222222222222222222222222222";

			mockRpc.setAccount(aliceAddr, {
				balance: 1_000_000_000_000_000_000n,
				nonce: 3n,
			});

			const storage = new Map<bigint, bigint>([
				[0n, 42n],
				[5n, 0xabcdef123456n],
			]);
			mockRpc.setAccount(contractAddr, {
				balance: 0n,
				nonce: 1n,
				code: "0x6080604052",
				storage,
			});

			const recorded = recordMockData(mockRpc);

			expect(recorded.accounts).toHaveLength(2);
			expect(recorded.accounts[0]).toEqual({
				address: aliceAddr,
				balance: 1_000_000_000_000_000_000n,
				nonce: 3n,
				code: "0x",
				storageSlots: [],
			});
			expect(recorded.accounts[1]).toEqual({
				address: contractAddr,
				balance: 0n,
				nonce: 1n,
				code: "0x6080604052",
				storageSlots: [
					{ slot: 0n, value: 42n },
					{ slot: 5n, value: 0xabcdef123456n },
				],
			});
		});

		it("records blocks and tracks highest forkBlockNumber", () => {
			const mockRpc = new MockRpcClient();
			const hash1 = `0x${"11".repeat(32)}`;
			const hash2 = `0x${"22".repeat(32)}`;
			const miner = "0x3333333333333333333333333333333333333333";

			mockRpc.setBlock({
				number: 100n,
				hash: hash1,
				parentHash: `0x${"00".repeat(32)}`,
				timestamp: 1700000000n,
				gasLimit: 30_000_000n,
				gasUsed: 15_000_000n,
				baseFeePerGas: 10_000_000_000n,
				miner,
				transactions: [`0x${"aa".repeat(32)}`],
			});
			mockRpc.setBlock({
				number: 101n,
				hash: hash2,
				parentHash: hash1,
				timestamp: 1700000012n,
				gasLimit: 30_000_000n,
				gasUsed: 0n,
				miner,
				transactions: [],
			});

			const recorded = recordMockData(mockRpc);

			expect(recorded.forkBlockNumber).toBe(101n);
			expect(recorded.blocks).toHaveLength(2);
			expect(recorded.blocks[0]?.baseFeePerGas).toBe(10_000_000_000n);
			expect(recorded.blocks[0]?.transactions).toEqual([
				`0x${"aa".repeat(32)}`,
			]);
			expect(recorded.blocks[1]?.baseFeePerGas).toBeUndefined();
			expect(recorded.blocks[1]?.parentHash).toBe(hash1);
		});
	});

	describe("serializeMockData", () => {
		it("serializes empty RecordedData into 16-byte little-endian header", () => {
			const data: RecordedData = {
				accounts: [],
				blocks: [],
				forkBlockNumber: 18_000_000n,
			};

			const buf = serializeMockData(data);
			expect(buf).toBeInstanceOf(Uint8Array);
			expect(buf.byteLength).toBe(16);

			const view = new DataView(buf.buffer);
			expect(view.getUint32(0, true)).toBe(0);
			expect(view.getUint32(4, true)).toBe(0);
			expect(view.getBigUint64(8, true)).toBe(18_000_000n);
		});

		it("serializes accounts with exact binary layout for address, u256 balance, u64 nonce, code, and storage", () => {
			const maxU256 = (1n << 256n) - 1n;
			const data: RecordedData = {
				forkBlockNumber: 500n,
				accounts: [
					{
						address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
						balance: maxU256,
						nonce: 77n,
						code: "0x6080604052",
						storageSlots: [
							{ slot: 1n, value: 0xdeadbeefn },
							{ slot: 256n, value: (1n << 128n) + 9n },
						],
					},
				],
				blocks: [],
			};

			const buf = serializeMockData(data);
			const view = new DataView(buf.buffer);
			let offset = 0;

			// Header
			expect(view.getUint32(offset, true)).toBe(1);
			offset += 4;
			expect(view.getUint32(offset, true)).toBe(0);
			offset += 4;
			expect(view.getBigUint64(offset, true)).toBe(500n);
			offset += 8;

			// Address (20 bytes)
			expect(bytesToHex(buf.subarray(offset, offset + 20))).toBe(
				"0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
			);
			offset += 20;

			// Balance (32 bytes BE u256)
			expect(readBigEndianU256(buf, offset)).toBe(maxU256);
			offset += 32;

			// Nonce (8 bytes LE u64)
			expect(view.getBigUint64(offset, true)).toBe(77n);
			offset += 8;

			// Code length + UTF-8 bytes
			const codeLen = view.getUint32(offset, true);
			offset += 4;
			expect(codeLen).toBe("0x6080604052".length);
			expect(
				new TextDecoder().decode(buf.subarray(offset, offset + codeLen)),
			).toBe("0x6080604052");
			offset += codeLen;

			// Storage count + entries
			expect(view.getUint32(offset, true)).toBe(2);
			offset += 4;

			expect(readBigEndianU256(buf, offset)).toBe(1n);
			offset += 32;
			expect(readBigEndianU256(buf, offset)).toBe(0xdeadbeefn);
			offset += 32;

			expect(readBigEndianU256(buf, offset)).toBe(256n);
			offset += 32;
			expect(readBigEndianU256(buf, offset)).toBe((1n << 128n) + 9n);
			offset += 32;

			expect(offset).toBe(buf.byteLength);
		});

		it("handles addresses without 0x prefix and serializes blocks after accounts", () => {
			const blockHash = `0x${"cd".repeat(32)}`;
			const data: RecordedData = {
				forkBlockNumber: 42n,
				accounts: [
					{
						address: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
						balance: 0n,
						nonce: 0n,
						code: "0x",
						storageSlots: [],
					},
				],
				blocks: [
					{
						number: 42n,
						hash: blockHash,
						parentHash: `0x${"00".repeat(32)}`,
						timestamp: 1700000000n,
						gasLimit: 30_000_000n,
						gasUsed: 21_000n,
						baseFeePerGas: 1_000_000_000n,
						miner: `0x${"11".repeat(20)}`,
						transactions: [`0x${"ff".repeat(32)}`],
					},
				],
			};

			const buf = serializeMockData(data);
			const view = new DataView(buf.buffer);

			expect(view.getUint32(0, true)).toBe(1);
			expect(view.getUint32(4, true)).toBe(1);
			expect(view.getBigUint64(8, true)).toBe(42n);

			// Account occupies 20 + 32 + 8 + 4 + 2 + 4 = 70 bytes after 16-byte header
			const blockStart = 16 + 70;
			expect(bytesToHex(buf.subarray(16, 36))).toBe(
				"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			);
			expect(view.getBigUint64(blockStart, true)).toBe(42n);

			const hashStart = blockStart + 8;
			const nul = buf.indexOf(0, hashStart);
			const decodedHash = new TextDecoder().decode(
				buf.subarray(hashStart, nul),
			);
			expect(decodedHash).toBe(blockHash);
		});

		it("round-trips recordMockData output directly into serializeMockData", () => {
			const mockRpc = new MockRpcClient();
			mockRpc.setAccount("0x4444444444444444444444444444444444444444", {
				balance: 500n,
				nonce: 2n,
				code: "0x6000",
				storage: new Map([[3n, 99n]]),
			});
			mockRpc.setBlock({
				number: 12n,
				hash: `0x${"ef".repeat(32)}`,
				parentHash: `0x${"00".repeat(32)}`,
				timestamp: 1700000000n,
				gasLimit: 30_000_000n,
				gasUsed: 0n,
				miner: `0x${"00".repeat(20)}`,
				transactions: [],
			});

			const recorded = recordMockData(mockRpc);
			const serialized = serializeMockData(recorded);
			const view = new DataView(serialized.buffer);

			expect(view.getUint32(0, true)).toBe(1);
			expect(view.getUint32(4, true)).toBe(1);
			expect(view.getBigUint64(8, true)).toBe(12n);
		});
	});
});
