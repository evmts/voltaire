import { describe, expect, it } from "vitest";
import { Address } from "../Address/index.js";
import * as BlockNumber from "../BlockNumber/from.js";
import * as EventLog from "../EventLog/index.js";
import { Hash } from "../Hash/index.js";
import * as TopicFilter from "../TopicFilter/index.js";
import * as LogFilter from "./index.js";

describe("LogFilter", () => {
	const addr1 = Address.from("0x1111111111111111111111111111111111111111");
	const addr2 = Address.from("0x2222222222222222222222222222222222222222");
	const hash1 = Hash.from(
		"0x1111111111111111111111111111111111111111111111111111111111111111",
	);
	const hash2 = Hash.from(
		"0x2222222222222222222222222222222222222222222222222222222222222222",
	);
	const blockHash = Hash.from(
		"0x3333333333333333333333333333333333333333333333333333333333333333",
	);

	describe("from", () => {
		it("creates empty filter", () => {
			const filter = LogFilter.from({});
			expect(filter).toEqual({});
		});

		it("creates filter with fromBlock and toBlock", () => {
			const filter = LogFilter.from({
				fromBlock: BlockNumber.from(1000),
				toBlock: BlockNumber.from(2000),
			});
			expect(filter.fromBlock).toBe(1000n);
			expect(filter.toBlock).toBe(2000n);
		});

		it("creates filter with block tags", () => {
			const filter = LogFilter.from({
				fromBlock: "latest",
				toBlock: "pending",
			});
			expect(filter.fromBlock).toBe("latest");
			expect(filter.toBlock).toBe("pending");
		});

		it("creates filter with single address", () => {
			const filter = LogFilter.from({
				address: addr1,
			});
			expect(filter.address).toBe(addr1);
		});

		it("creates filter with address array", () => {
			const filter = LogFilter.from({
				address: [addr1, addr2],
			});
			expect(Array.isArray(filter.address)).toBe(true);
		});

		it("creates filter with topics", () => {
			const topics = TopicFilter.from([hash1, null]);
			const filter = LogFilter.from({
				topics,
			});
			expect(filter.topics).toBe(topics);
		});

		it("creates filter with blockhash", () => {
			const filter = LogFilter.from({
				blockhash: blockHash,
				address: addr1,
			});
			expect(filter.blockhash).toBe(blockHash);
		});

		it("throws on non-object params", () => {
			expect(() => LogFilter.from("not object" as any)).toThrow(
				LogFilter.InvalidLogFilterError,
			);
		});

		it("throws on blockhash with fromBlock", () => {
			expect(() =>
				LogFilter.from({
					blockhash: blockHash,
					fromBlock: BlockNumber.from(1000),
				}),
			).toThrow(LogFilter.InvalidLogFilterError);
		});

		it("throws on blockhash with toBlock", () => {
			expect(() =>
				LogFilter.from({
					blockhash: blockHash,
					toBlock: "latest",
				}),
			).toThrow(LogFilter.InvalidLogFilterError);
		});

		it("throws on invalid blockhash", () => {
			expect(() =>
				LogFilter.from({
					blockhash: new Uint8Array(20) as any,
				}),
			).toThrow(LogFilter.InvalidLogFilterError);
		});

		it("throws on invalid fromBlock", () => {
			expect(() =>
				LogFilter.from({
					fromBlock: "invalid" as any,
				}),
			).toThrow(LogFilter.InvalidLogFilterError);
		});

		it("throws on invalid address", () => {
			expect(() =>
				LogFilter.from({
					address: new Uint8Array(32) as any,
				}),
			).toThrow(LogFilter.InvalidLogFilterError);
		});

		it("throws on invalid address in array", () => {
			expect(() =>
				LogFilter.from({
					address: [addr1, new Uint8Array(32)] as any,
				}),
			).toThrow(LogFilter.InvalidLogFilterError);
		});

		it("throws on invalid topics", () => {
			expect(() =>
				LogFilter.from({
					topics: "not array" as any,
				}),
			).toThrow(LogFilter.InvalidLogFilterError);
		});
	});

	describe("matches", () => {
		it("matches log with empty filter", () => {
			const filter = LogFilter.from({});
			const log = EventLog.from({
				address: addr1,
				topics: [hash1],
				data: new Uint8Array(),
			});
			expect(LogFilter.matches(filter, log)).toBe(true);
		});

		it("matches log with address filter", () => {
			const filter = LogFilter.from({ address: addr1 });
			const log1 = EventLog.from({
				address: addr1,
				topics: [hash1],
				data: new Uint8Array(),
			});
			const log2 = EventLog.from({
				address: addr2,
				topics: [hash1],
				data: new Uint8Array(),
			});
			expect(LogFilter.matches(filter, log1)).toBe(true);
			expect(LogFilter.matches(filter, log2)).toBe(false);
		});

		it("matches log with address array (OR logic)", () => {
			const filter = LogFilter.from({ address: [addr1, addr2] });
			const log1 = EventLog.from({
				address: addr1,
				topics: [hash1],
				data: new Uint8Array(),
			});
			const log2 = EventLog.from({
				address: addr2,
				topics: [hash1],
				data: new Uint8Array(),
			});
			const log3 = EventLog.from({
				address: Address.from("0x3333333333333333333333333333333333333333"),
				topics: [hash1],
				data: new Uint8Array(),
			});
			expect(LogFilter.matches(filter, log1)).toBe(true);
			expect(LogFilter.matches(filter, log2)).toBe(true);
			expect(LogFilter.matches(filter, log3)).toBe(false);
		});

		it("matches log with block range", () => {
			const filter = LogFilter.from({
				fromBlock: BlockNumber.from(1000),
				toBlock: BlockNumber.from(2000),
			});
			const log1 = EventLog.from({
				address: addr1,
				topics: [hash1],
				data: new Uint8Array(),
				blockNumber: 1500n,
			});
			const log2 = EventLog.from({
				address: addr1,
				topics: [hash1],
				data: new Uint8Array(),
				blockNumber: 500n,
			});
			const log3 = EventLog.from({
				address: addr1,
				topics: [hash1],
				data: new Uint8Array(),
				blockNumber: 2500n,
			});
			expect(LogFilter.matches(filter, log1)).toBe(true);
			expect(LogFilter.matches(filter, log2)).toBe(false);
			expect(LogFilter.matches(filter, log3)).toBe(false);
		});

		it("matches log with topics", () => {
			const topics = TopicFilter.from([hash1, null]);
			const filter = LogFilter.from({ topics });
			const log1 = EventLog.from({
				address: addr1,
				topics: [hash1, hash2],
				data: new Uint8Array(),
			});
			const log2 = EventLog.from({
				address: addr1,
				topics: [hash2, hash1],
				data: new Uint8Array(),
			});
			expect(LogFilter.matches(filter, log1)).toBe(true);
			expect(LogFilter.matches(filter, log2)).toBe(false);
		});

		it("matches log with blockhash", () => {
			const filter = LogFilter.from({ blockhash: blockHash });
			const log1 = EventLog.from({
				address: addr1,
				topics: [hash1],
				data: new Uint8Array(),
				blockHash,
			});
			const log2 = EventLog.from({
				address: addr1,
				topics: [hash1],
				data: new Uint8Array(),
				blockHash: hash2,
			});
			expect(LogFilter.matches(filter, log1)).toBe(true);
			expect(LogFilter.matches(filter, log2)).toBe(false);
		});

		it("matches complex filter", () => {
			const topics = TopicFilter.from([hash1]);
			const filter = LogFilter.from({
				address: addr1,
				fromBlock: BlockNumber.from(1000),
				toBlock: BlockNumber.from(2000),
				topics,
			});
			const log = EventLog.from({
				address: addr1,
				topics: [hash1],
				data: new Uint8Array(),
				blockNumber: 1500n,
			});
			expect(LogFilter.matches(filter, log)).toBe(true);
		});
	});

	describe("isEmpty", () => {
		it("returns true for empty filter", () => {
			const filter = LogFilter.from({});
			expect(LogFilter.isEmpty(filter)).toBe(true);
		});

		it("returns false when has address", () => {
			const filter = LogFilter.from({ address: addr1 });
			expect(LogFilter.isEmpty(filter)).toBe(false);
		});

		it("returns false when has fromBlock", () => {
			const filter = LogFilter.from({
				fromBlock: BlockNumber.from(1000),
			});
			expect(LogFilter.isEmpty(filter)).toBe(false);
		});

		it("returns false when has toBlock", () => {
			const filter = LogFilter.from({ toBlock: "latest" });
			expect(LogFilter.isEmpty(filter)).toBe(false);
		});

		it("returns false when has blockhash", () => {
			const filter = LogFilter.from({ blockhash: blockHash });
			expect(LogFilter.isEmpty(filter)).toBe(false);
		});

		it("returns false when has topics", () => {
			const topics = TopicFilter.from([hash1]);
			const filter = LogFilter.from({ topics });
			expect(LogFilter.isEmpty(filter)).toBe(false);
		});

		it("returns true when has empty topics", () => {
			const topics = TopicFilter.from([]);
			const filter = LogFilter.from({ topics });
			expect(LogFilter.isEmpty(filter)).toBe(true);
		});
	});
});
