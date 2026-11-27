import { describe, expect, it } from "vitest";
import { MockRpcClient } from "../provider/test-utils/MockRpcClient.js";
import {
	type RecordedData,
	recordMockData,
	serializeMockData,
} from "./MockDataRecorder.js";

const ADDR_A = "0x11223344556677889900aabbccddeeff00112233";
const ADDR_B = "0xabcdef0123456789abcdef0123456789abcdef01";
const HASH_1 = `0x${"aa".repeat(32)}`;
const HASH_2 = `0x${"bb".repeat(32)}`;

describe("MockDataRecorder", () => {
	it("records accounts, storage slots, blocks, and fork block number from MockRpcClient", () => {
		const rpc = new MockRpcClient();
		const storage = new Map<bigint, bigint>([
			[0n, 100n],
			[5n, 0x123456789abcdef0n],
		]);
		rpc.setAccount(ADDR_A, {
			balance: 5_000_000_000_000_000_000n,
			nonce: 12n,
			code: "0x6001600055",
			storage,
		});
		rpc.setBlock({
			number: 100n,
			hash: HASH_1,
			parentHash: `0x${"00".repeat(32)}`,
			timestamp: 1_700_000_100n,
			gasLimit: 30_000_000n,
			gasUsed: 21_000n,
			baseFeePerGas: 10_000_000_000n,
			miner: ADDR_B,
			transactions: [],
		});
		rpc.setBlock({
			number: 101n,
			hash: HASH_2,
			parentHash: HASH_1,
			timestamp: 1_700_000_112n,
			gasLimit: 30_000_000n,
			gasUsed: 42_000n,
			miner: ADDR_B,
			transactions: ["0x01", "0x02"],
		});

		const recorded = recordMockData(rpc);

		expect(recorded.forkBlockNumber).toBe(101n);
		expect(recorded.accounts).toHaveLength(1);
		expect(recorded.accounts[0]).toEqual({
			address: ADDR_A,
			balance: 5_000_000_000_000_000_000n,
			nonce: 12n,
			code: "0x6001600055",
			storageSlots: [
				{ slot: 0n, value: 100n },
				{ slot: 5n, value: 0x123456789abcdef0n },
			],
		});
		expect(recorded.blocks).toHaveLength(2);
		expect(recorded.blocks[0]?.number).toBe(100n);
		expect(recorded.blocks[1]?.transactions).toEqual(["0x01", "0x02"]);
	});

	it("serializes header, account fields, storage pairs, and blocks into binary FFI layout", () => {
		const data: RecordedData = {
			forkBlockNumber: 42_000n,
			accounts: [
				{
					address: ADDR_A,
					balance: 0x0102030405060708n,
					nonce: 9n,
					code: "0x6000",
					storageSlots: [{ slot: 1n, value: 0xffn }],
				},
			],
			blocks: [
				{
					number: 42_000n,
					hash: HASH_1,
					parentHash: HASH_2,
					timestamp: 1_700_000_000n,
					gasLimit: 30_000_000n,
					gasUsed: 21_000n,
					baseFeePerGas: 1_000_000_000n,
					miner: ADDR_B,
					transactions: [],
				},
			],
		};

		const buf = serializeMockData(data);
		const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

		// Header: [num_accounts: u32, num_blocks: u32, fork_block_number: u64]
		expect(view.getUint32(0, true)).toBe(1);
		expect(view.getUint32(4, true)).toBe(1);
		expect(view.getBigUint64(8, true)).toBe(42_000n);

		// Account 0 address (20 bytes starting at offset 16)
		expect(buf[16]).toBe(0x11);
		expect(buf[17]).toBe(0x22);
		expect(buf[35]).toBe(0x33);

		// Account 0 balance (32 bytes big-endian at offset 36..67)
		expect(buf[36]).toBe(0x00);
		expect(buf[60]).toBe(0x01);
		expect(buf[67]).toBe(0x08);

		// Account 0 nonce (u64 little-endian at offset 68)
		expect(view.getBigUint64(68, true)).toBe(9n);

		// Account 0 code ("0x6000" = 6 bytes at offset 76)
		const codeLen = view.getUint32(76, true);
		expect(codeLen).toBe(6);
		expect(new TextDecoder().decode(buf.subarray(80, 80 + codeLen))).toBe(
			"0x6000",
		);

		// Storage count + single (slot=1, value=0xff) pair
		const storageOffset = 80 + codeLen;
		expect(view.getUint32(storageOffset, true)).toBe(1);
		expect(buf[storageOffset + 4 + 31]).toBe(0x01);
		expect(buf[storageOffset + 4 + 32 + 31]).toBe(0xff);

		// Block 0 number + null-terminated hash
		const blockOffset = storageOffset + 4 + 64;
		expect(view.getBigUint64(blockOffset, true)).toBe(42_000n);
		const hashStart = blockOffset + 8;
		const decodedHash = new TextDecoder().decode(
			buf.subarray(hashStart, hashStart + HASH_1.length),
		);
		expect(decodedHash).toBe(HASH_1);
		expect(buf[hashStart + HASH_1.length]).toBe(0);
	});

	it("handles empty MockRpcClient and max u256 balances without overflow", () => {
		const emptyRpc = new MockRpcClient();
		const emptyRecorded = recordMockData(emptyRpc);
		expect(emptyRecorded).toEqual({
			accounts: [],
			blocks: [],
			forkBlockNumber: 0n,
		});

		const emptyBuf = serializeMockData(emptyRecorded);
		expect(emptyBuf.byteLength).toBe(16);
		const emptyView = new DataView(emptyBuf.buffer);
		expect(emptyView.getUint32(0, true)).toBe(0);
		expect(emptyView.getUint32(4, true)).toBe(0);
		expect(emptyView.getBigUint64(8, true)).toBe(0n);

		const maxU256 = (1n << 256n) - 1n;
		const maxBuf = serializeMockData({
			forkBlockNumber: 1n,
			accounts: [
				{
					address: ADDR_B.slice(2), // no 0x prefix
					balance: maxU256,
					nonce: 0n,
					code: "",
					storageSlots: [{ slot: maxU256, value: maxU256 }],
				},
			],
			blocks: [],
		});
		// Every byte of the 32-byte balance must be 0xff
		for (let i = 36; i < 68; i++) {
			expect(maxBuf[i]).toBe(0xff);
		}
	});
});
