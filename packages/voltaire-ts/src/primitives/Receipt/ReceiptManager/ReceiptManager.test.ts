import { describe, expect, it } from "vitest";
import type { AddressType } from "../../Address/AddressType.js";
import type { BlockHashType } from "../../BlockHash/BlockHashType.js";
import type { BlockNumberType } from "../../BlockNumber/BlockNumberType.js";
import type { EventLogType } from "../../EventLog/EventLogType.js";
import type { HashType } from "../../Hash/HashType.js";
import type { TransactionHashType } from "../../TransactionHash/TransactionHashType.js";
import type { TransactionIndexType } from "../../TransactionIndex/TransactionIndexType.js";
import type { Uint256Type } from "../../Uint/Uint256Type.js";
import { InvalidReceiptLengthError } from "../errors.js";
import * as Receipt from "../index.js";
import type { ReceiptType } from "../ReceiptType.js";
import { ReceiptManager } from "./index.js";

const bytes = (n: number, fill: number) => new Uint8Array(n).fill(fill);
const blockHash = (n: number) => bytes(32, n) as BlockHashType;
const txHash = (n: number) => bytes(32, 0x80 + n) as TransactionHashType;
const addr = (n: number) => bytes(20, n) as AddressType;
const topic = (n: number) => bytes(32, 0x40 + n) as HashType;

const log = (address: AddressType, topics: HashType[]): EventLogType =>
	({ address, topics, data: new Uint8Array([1]) }) as EventLogType;

const receipt = (
	tx: number,
	block: number,
	logs: EventLogType[] = [],
): ReceiptType =>
	({
		transactionHash: txHash(tx),
		transactionIndex: tx as TransactionIndexType,
		blockHash: blockHash(block),
		blockNumber: BigInt(block) as BlockNumberType,
		from: addr(0xf0),
		to: addr(0xf1),
		cumulativeGasUsed: 21000n as Uint256Type,
		gasUsed: 21000n as Uint256Type,
		contractAddress: null,
		logs,
		logsBloom: new Uint8Array(256),
		effectiveGasPrice: 1n as Uint256Type,
		type: "eip1559",
	}) as ReceiptType;

// block 1: tx0 -> [A(t0,t1)], tx1 -> [B(t0), A(t2)]
// block 2: tx2 -> [B(t1,t1)]
function seeded() {
	const m = ReceiptManager();
	m.saveReceipts(blockHash(1), [
		receipt(0, 1, [log(addr(0xa), [topic(0), topic(1)])]),
		receipt(1, 1, [log(addr(0xb), [topic(0)]), log(addr(0xa), [topic(2)])]),
	]);
	m.saveReceipts(blockHash(2), [
		receipt(2, 2, [log(addr(0xb), [topic(1), topic(1)])]),
	]);
	return m;
}

describe("ReceiptManager", () => {
	it("is exported from Receipt namespace", () => {
		expect(Receipt.ReceiptManager).toBe(ReceiptManager);
	});

	it("saves and gets receipts by block hash", () => {
		const m = seeded();
		expect(m.hasReceipts(blockHash(1))).toBe(true);
		expect(m.getReceipts(blockHash(1))?.length).toBe(2);
		expect(m.getReceipts(blockHash(9))).toBeUndefined();
		expect(m.hasReceipts(blockHash(9))).toBe(false);
	});

	it("looks up by bytes, not identity", () => {
		const m = seeded();
		const copy = new Uint8Array(blockHash(2)) as BlockHashType;
		expect(m.getReceipts(copy)?.[0]?.transactionHash).toEqual(txHash(2));
	});

	it("stored receipt list is a frozen copy", () => {
		const m = ReceiptManager();
		const list = [receipt(0, 1)];
		m.saveReceipts(blockHash(1), list);
		list.push(receipt(1, 1));
		const got = m.getReceipts(blockHash(1));
		expect(got?.length).toBe(1);
		expect(Object.isFrozen(got)).toBe(true);
	});

	it("owns block hashes and nested receipt bytes on insertion and reads", () => {
		const m = ReceiptManager();
		const hash = blockHash(1);
		const event = log(addr(0xa), [topic(0)]);
		event.transactionHash = topic(9);
		const input = {
			...receipt(0, 1, [event]),
			root: topic(3),
			logsBloom: Buffer.alloc(256, 1),
		};
		m.saveReceipts(hash, [input]);

		const mutate = (r: ReceiptType) => {
			r.transactionHash.fill(0);
			r.blockHash.fill(0);
			r.from.fill(0);
			r.to?.fill(0);
			r.root?.fill(0);
			r.logsBloom.fill(0);
			r.logs[0]?.address.fill(0);
			r.logs[0]?.topics[0]?.fill(0);
			r.logs[0]?.data.fill(0);
			r.logs[0]?.transactionHash?.fill(0);
		};
		hash.fill(0);
		mutate(input);

		const found = m.getReceiptByTxHash(txHash(0));
		expect(found?.blockHash).toEqual(blockHash(1));
		found?.blockHash.fill(0);
		if (found) mutate(found.receipt);
		const [stored] = m.getReceipts(blockHash(1)) ?? [];
		if (stored) mutate(stored);
		const [result] = m.getLogs();
		result?.blockHash?.fill(0);
		result?.transactionHash?.fill(0);
		result?.address.fill(0);
		result?.topics[0]?.fill(0);
		result?.data.fill(0);

		expect(m.getReceiptByTxHash(txHash(0))).toMatchObject({
			blockHash: blockHash(1),
			receipt: {
				transactionHash: txHash(0),
				blockHash: blockHash(1),
				from: addr(0xf0),
				to: addr(0xf1),
				root: topic(3),
				logsBloom: new Uint8Array(256).fill(1),
				logs: [{ ...log(addr(0xa), [topic(0)]), transactionHash: topic(9) }],
			},
		});
		expect(m.getLogs()[0]).toMatchObject({
			...log(addr(0xa), [topic(0)]),
			blockHash: blockHash(1),
			transactionHash: txHash(0),
		});
		expect(m.deleteReceipts(blockHash(1))).toBe(true);
		expect(m.getReceiptByTxHash(txHash(0))).toBeUndefined();
	});

	it("getReceiptByTxHash returns receipt, blockHash, txIndex", () => {
		const m = seeded();
		const found = m.getReceiptByTxHash(txHash(1));
		expect(found?.txIndex).toBe(1);
		expect(found?.blockHash).toEqual(blockHash(1));
		expect(found?.receipt.transactionHash).toEqual(txHash(1));
		expect(m.getReceiptByTxHash(txHash(7))).toBeUndefined();
	});

	it("deleteReceipts removes receipts, logs and tx index", () => {
		const m = seeded();
		expect(m.deleteReceipts(blockHash(1))).toBe(true);
		expect(m.hasReceipts(blockHash(1))).toBe(false);
		expect(m.getReceiptByTxHash(txHash(0))).toBeUndefined();
		expect(m.getReceiptByTxHash(txHash(1))).toBeUndefined();
		expect(m.getReceiptByTxHash(txHash(2))?.txIndex).toBe(0);
		expect(m.getLogs().length).toBe(1);
		expect(m.deleteReceipts(blockHash(1))).toBe(false);
	});

	it("reorg: deleting the orphaned block keeps the re-included tx entry", () => {
		const m = ReceiptManager();
		m.saveReceipts(blockHash(1), [receipt(0, 1)]);
		m.saveReceipts(blockHash(2), [receipt(5, 2), receipt(0, 2)]);
		expect(m.getReceiptByTxHash(txHash(0))?.blockHash).toEqual(blockHash(2));
		m.deleteReceipts(blockHash(1));
		const found = m.getReceiptByTxHash(txHash(0));
		expect(found?.blockHash).toEqual(blockHash(2));
		expect(found?.txIndex).toBe(1);
	});

	it("uses the new receipt block number for re-included logs", () => {
		const m = ReceiptManager();
		const event = { ...log(addr(1), []), blockNumber: 1n };
		m.saveReceipts(blockHash(1), [receipt(0, 1, [event])]);
		m.saveReceipts(blockHash(2), [receipt(0, 2, [event])]);
		m.deleteReceipts(blockHash(1));

		expect(m.getLogs()).toMatchObject([
			{ blockHash: blockHash(2), blockNumber: 2n },
		]);
	});

	it("reorg: deleting the newer block restores the surviving tx entry", () => {
		const m = ReceiptManager();
		m.saveReceipts(blockHash(1), [receipt(5, 1), receipt(0, 1)]);
		m.saveReceipts(blockHash(2), [receipt(0, 2), receipt(6, 2)]);
		expect(m.getReceiptByTxHash(txHash(0))?.blockHash).toEqual(blockHash(2));
		expect(m.deleteReceipts(blockHash(2))).toBe(true);
		expect(m.getReceiptByTxHash(txHash(0))).toMatchObject({
			blockHash: blockHash(1),
			txIndex: 1,
		});
		expect(m.getReceiptByTxHash(txHash(6))).toBeUndefined();
	});

	it("reorg: a tx in three forks falls back in save order as forks are deleted", () => {
		const m = ReceiptManager();
		m.saveReceipts(blockHash(1), [receipt(0, 1)]);
		m.saveReceipts(blockHash(2), [receipt(7, 2), receipt(0, 2)]);
		m.saveReceipts(blockHash(3), [receipt(8, 3), receipt(9, 3), receipt(0, 3)]);
		expect(m.getReceiptByTxHash(txHash(0))).toMatchObject({
			blockHash: blockHash(3),
			txIndex: 2,
		});
		// Deleting a middle fork leaves the newest location in place.
		m.deleteReceipts(blockHash(2));
		expect(m.getReceiptByTxHash(txHash(0))?.blockHash).toEqual(blockHash(3));
		expect(m.getReceiptByTxHash(txHash(7))).toBeUndefined();
		m.deleteReceipts(blockHash(3));
		expect(m.getReceiptByTxHash(txHash(0))).toMatchObject({
			blockHash: blockHash(1),
			txIndex: 0,
		});
		m.deleteReceipts(blockHash(1));
		expect(m.getReceiptByTxHash(txHash(0))).toBeUndefined();
	});

	it("reorg: re-saving an older fork makes it the preferred location", () => {
		const m = ReceiptManager();
		m.saveReceipts(blockHash(1), [receipt(0, 1)]);
		m.saveReceipts(blockHash(2), [receipt(0, 2)]);
		m.saveReceipts(blockHash(1), [receipt(4, 1), receipt(0, 1)]);
		expect(m.getReceiptByTxHash(txHash(0))).toMatchObject({
			blockHash: blockHash(1),
			txIndex: 1,
		});
		m.deleteReceipts(blockHash(1));
		expect(m.getReceiptByTxHash(txHash(0))?.blockHash).toEqual(blockHash(2));
	});

	it("a tx hash repeated inside one block resolves to its last index and deletes cleanly", () => {
		const m = ReceiptManager();
		m.saveReceipts(blockHash(1), [receipt(0, 1), receipt(1, 1), receipt(0, 1)]);
		expect(m.getReceiptByTxHash(txHash(0))?.txIndex).toBe(2);
		m.deleteReceipts(blockHash(1));
		expect(m.getReceiptByTxHash(txHash(0))).toBeUndefined();
	});

	it("deleteReceipts does not scan surviving blocks", () => {
		const m = ReceiptManager();
		const wide = (n: number) => {
			const hash = new Uint8Array(32);
			new DataView(hash.buffer).setUint32(28, n);
			return hash;
		};
		const BLOCKS = 4000;
		for (let i = 0; i < BLOCKS; i++) {
			const r = receipt(0, 1);
			m.saveReceipts(wide(i) as BlockHashType, [
				{ ...r, transactionHash: wide(1_000_000 + i) as TransactionHashType },
			]);
		}
		// Each surviving block reads `txKeys` at most once per delete under a
		// scan. Count reads of the surviving state through timing-free means:
		// every tx still resolves to its own block after half are deleted.
		const start = performance.now();
		for (let i = 0; i < BLOCKS; i += 2) {
			expect(m.deleteReceipts(wide(i) as BlockHashType)).toBe(true);
		}
		const elapsed = performance.now() - start;
		for (let i = 0; i < BLOCKS; i++) {
			const found = m.getReceiptByTxHash(
				wide(1_000_000 + i) as TransactionHashType,
			);
			if (i % 2 === 0) expect(found).toBeUndefined();
			else expect(found?.blockHash).toEqual(wide(i));
		}
		// 2,000 deletes over 4,000 blocks: a per-delete scan is 6 million
		// block visits; the location list is 2,000 map operations.
		expect(elapsed).toBeLessThan(500);
	});

	it("re-saving a block drops its stale tx index entries", () => {
		const m = ReceiptManager();
		m.saveReceipts(blockHash(1), [receipt(0, 1), receipt(1, 1)]);
		m.saveReceipts(blockHash(1), [receipt(1, 1)]);
		expect(m.getReceiptByTxHash(txHash(0))).toBeUndefined();
		expect(m.getReceiptByTxHash(txHash(1))?.txIndex).toBe(0);
	});

	it("clear removes everything", () => {
		const m = seeded();
		m.clear();
		expect(m.hasReceipts(blockHash(1))).toBe(false);
		expect(m.getReceiptByTxHash(txHash(2))).toBeUndefined();
		expect(m.getLogs()).toEqual([]);
	});

	it("rejects non-32-byte hashes without mutating state", () => {
		const m = seeded();
		expect(() =>
			m.getReceipts(new Uint8Array(31) as unknown as BlockHashType),
		).toThrow(InvalidReceiptLengthError);
		const bad = { ...receipt(9, 1), transactionHash: new Uint8Array(3) };
		expect(() =>
			m.saveReceipts(blockHash(1), [bad as unknown as ReceiptType]),
		).toThrow(InvalidReceiptLengthError);
		expect(m.getReceipts(blockHash(1))?.length).toBe(2);
		expect(m.getReceiptByTxHash(txHash(0))?.txIndex).toBe(0);
	});

	describe("getLogs", () => {
		it("returns all logs with block-wide positions filled", () => {
			const logs = seeded().getLogs();
			expect(logs.length).toBe(4);
			expect(logs.map((l) => l.logIndex)).toEqual([0, 1, 2, 0]);
			expect(logs.map((l) => l.transactionIndex)).toEqual([0, 1, 1, 0]);
			expect(logs[2]?.transactionHash).toEqual(txHash(1));
			expect(logs[3]?.blockHash).toEqual(blockHash(2));
			expect(logs[3]?.blockNumber).toBe(2n);
			expect(logs[0]?.removed).toBe(false);
		});

		it("derives log positions from the stored block even if input metadata differs", () => {
			const m = ReceiptManager();
			const l = {
				...log(addr(1), []),
				blockHash: topic(9),
				transactionHash: topic(8),
				transactionIndex: 7,
				logIndex: 7,
			};
			m.saveReceipts(blockHash(1), [receipt(0, 1, [l])]);
			expect(m.getLogs()[0]).toMatchObject({
				blockHash: blockHash(1),
				transactionHash: txHash(0),
				transactionIndex: 0,
				logIndex: 0,
			});
		});

		it("filters by blockHashes", () => {
			const m = seeded();
			expect(m.getLogs({ blockHashes: [blockHash(2)] }).length).toBe(1);
			expect(
				m.getLogs({ blockHashes: [blockHash(2), blockHash(2)] }).length,
			).toBe(1);
			expect(m.getLogs({ blockHashes: [blockHash(9)] })).toEqual([]);
			expect(m.getLogs({ blockHashes: [] })).toEqual([]);
		});

		it("filters by single address and address OR-list", () => {
			const m = seeded();
			expect(m.getLogs({ address: addr(0xa) }).length).toBe(2);
			expect(m.getLogs({ address: [addr(0xa), addr(0xb)] }).length).toBe(4);
			expect(m.getLogs({ address: [addr(0xc)] })).toEqual([]);
			expect(m.getLogs({ address: [] }).length).toBe(4);
		});

		it("topics: exact position match", () => {
			const m = seeded();
			const logs = m.getLogs({ topics: [topic(0)] });
			expect(logs.map((l) => l.address[0])).toEqual([0xa, 0xb]);
		});

		it("topics: null wildcard requires the later position to exist", () => {
			const m = seeded();
			const logs = m.getLogs({ topics: [null, topic(1)] });
			expect(logs.map((l) => l.blockHash?.[0])).toEqual([1, 2]);
			expect(m.getLogs({ topics: [null] }).length).toBe(4);
		});

		it("topics: OR-array per position", () => {
			const m = seeded();
			expect(m.getLogs({ topics: [[topic(1), topic(2)]] }).length).toBe(2);
			expect(m.getLogs({ topics: [[], topic(1)] }).length).toBe(2);
		});

		it("topics: wildcard filters require a topic at every position", () => {
			const m = ReceiptManager();
			m.saveReceipts(blockHash(1), [
				receipt(0, 1, [log(addr(1), []), log(addr(1), [topic(0)])]),
			]);
			expect(m.getLogs()).toHaveLength(2);
			expect(m.getLogs({ topics: [null] })).toHaveLength(1);
			expect(
				m.getLogs({ topics: [undefined] as unknown as [null] }),
			).toHaveLength(1);
			expect(m.getLogs({ topics: [[]] })).toHaveLength(1);
		});

		it("topics: position beyond log topics does not match", () => {
			const m = seeded();
			expect(m.getLogs({ topics: [topic(0), topic(1), null] })).toEqual([]);
			expect(m.getLogs({ topics: [topic(0), topic(1), []] })).toEqual([]);
			expect(m.getLogs({ topics: [topic(0), topic(1), topic(3)] })).toEqual([]);
		});

		it("combines address, topics and blockHashes", () => {
			const m = seeded();
			const logs = m.getLogs({
				blockHashes: [blockHash(1)],
				address: addr(0xb),
				topics: [topic(0)],
			});
			expect(logs.length).toBe(1);
			expect(logs[0]?.logIndex).toBe(1);
		});
	});
});
