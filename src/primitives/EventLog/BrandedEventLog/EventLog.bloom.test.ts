import { describe, expect, it } from "vitest";
import { create, filterLogs } from "./index.js";
import * as BloomFilter from "../../BloomFilter/index.js";
import * as Address from "../../../Address/index.js";
import * as Hash from "../../../Hash/index.js";
import { BITS, DEFAULT_HASH_COUNT } from "../../BloomFilter/BrandedBloomFilter/constants.js";

describe("EventLog + BloomFilter Integration", () => {
	describe("Address filtering with bloom", () => {
		it("filters logs by address using bloom", () => {
			const addr1 = Address.from("0x0000000000000000000000000000000000000001");
			const addr2 = Address.from("0x0000000000000000000000000000000000000002");

			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(bloom, addr1 as Uint8Array);

			const log1 = create({
				address: addr1,
				topics: [Hash.from("0x0000000000000000000000000000000000000000000000000000000000000010")],
				data: new Uint8Array([1]),
			});

			const log2 = create({
				address: addr2,
				topics: [Hash.from("0x0000000000000000000000000000000000000000000000000000000000000010")],
				data: new Uint8Array([2]),
			});

			const shouldCheck1 = BloomFilter.contains(bloom, addr1 as Uint8Array);
			const shouldCheck2 = BloomFilter.contains(bloom, addr2 as Uint8Array);

			expect(shouldCheck1).toBe(true);
			expect(shouldCheck2).toBe(false);
		});

		it("uses bloom for quick rejection", () => {
			const targetAddr = Address.from("0x0000000000000000000000000000000000000001");
			const otherAddr = Address.from("0x0000000000000000000000000000000000000002");

			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(bloom, targetAddr as Uint8Array);

			const logs = Array.from({ length: 100 }, (_, i) =>
				create({
					address: i === 50 ? targetAddr : otherAddr,
					topics: [Hash.from(`0x${i.toString(16).padStart(64, "0")}`)],
					data: new Uint8Array([i]),
				}),
			);

			const candidates = logs.filter((log) =>
				BloomFilter.contains(bloom, log.address as Uint8Array),
			);

			expect(candidates.length).toBeLessThan(20);

			const actualMatches = candidates.filter((log) => log.address === targetAddr);
			expect(actualMatches.length).toBe(1);
			expect(actualMatches[0]?.data[0]).toBe(50);
		});
	});

	describe("Topic filtering with bloom", () => {
		it("filters logs by topic using bloom", () => {
			const topic1 = Hash.from("0x0000000000000000000000000000000000000000000000000000000000000010");
			const topic2 = Hash.from("0x0000000000000000000000000000000000000000000000000000000000000020");

			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(bloom, topic1 as Uint8Array);

			const shouldCheck1 = BloomFilter.contains(bloom, topic1 as Uint8Array);
			const shouldCheck2 = BloomFilter.contains(bloom, topic2 as Uint8Array);

			expect(shouldCheck1).toBe(true);
			expect(shouldCheck2).toBe(false);
		});

		it("checks all topics in log", () => {
			const targetTopic = Hash.from("0x0000000000000000000000000000000000000000000000000000000000000010");
			const otherTopic = Hash.from("0x0000000000000000000000000000000000000000000000000000000000000020");

			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(bloom, targetTopic as Uint8Array);

			const log = create({
				address: Address.from("0x0000000000000000000000000000000000000001"),
				topics: [targetTopic, otherTopic],
				data: new Uint8Array([1]),
			});

			const matchesSignature = BloomFilter.contains(bloom, log.topics[0] as Uint8Array);
			expect(matchesSignature).toBe(true);
		});
	});

	describe("Combined address + topic filtering", () => {
		it("filters by both address and topic", () => {
			const addr = Address.from("0x0000000000000000000000000000000000000001");
			const topic = Hash.from("0x0000000000000000000000000000000000000000000000000000000000000010");

			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(bloom, addr as Uint8Array);
			BloomFilter.add(bloom, topic as Uint8Array);

			const log = create({
				address: addr,
				topics: [topic],
				data: new Uint8Array([1]),
			});

			const addrMatch = BloomFilter.contains(bloom, log.address as Uint8Array);
			const topicMatch = BloomFilter.contains(bloom, log.topics[0] as Uint8Array);

			expect(addrMatch).toBe(true);
			expect(topicMatch).toBe(true);
		});

		it("rejects log if address not in bloom", () => {
			const targetAddr = Address.from("0x0000000000000000000000000000000000000001");
			const wrongAddr = Address.from("0x0000000000000000000000000000000000000002");
			const topic = Hash.from("0x0000000000000000000000000000000000000000000000000000000000000010");

			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(bloom, targetAddr as Uint8Array);
			BloomFilter.add(bloom, topic as Uint8Array);

			const log = create({
				address: wrongAddr,
				topics: [topic],
				data: new Uint8Array([1]),
			});

			const addrMatch = BloomFilter.contains(bloom, log.address as Uint8Array);
			expect(addrMatch).toBe(false);
		});

		it("rejects log if topic not in bloom", () => {
			const addr = Address.from("0x0000000000000000000000000000000000000001");
			const targetTopic = Hash.from("0x0000000000000000000000000000000000000000000000000000000000000010");
			const wrongTopic = Hash.from("0x0000000000000000000000000000000000000000000000000000000000000020");

			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(bloom, addr as Uint8Array);
			BloomFilter.add(bloom, targetTopic as Uint8Array);

			const log = create({
				address: addr,
				topics: [wrongTopic],
				data: new Uint8Array([1]),
			});

			const topicMatch = BloomFilter.contains(bloom, log.topics[0] as Uint8Array);
			expect(topicMatch).toBe(false);
		});
	});

	describe("Building bloom from logs", () => {
		it("builds bloom filter from single log", () => {
			const addr = Address.from("0x0000000000000000000000000000000000000001");
			const topic = Hash.from("0x0000000000000000000000000000000000000000000000000000000000000010");

			const log = create({
				address: addr,
				topics: [topic],
				data: new Uint8Array([1]),
			});

			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(bloom, log.address as Uint8Array);
			for (const t of log.topics) {
				BloomFilter.add(bloom, t as Uint8Array);
			}

			expect(BloomFilter.contains(bloom, addr as Uint8Array)).toBe(true);
			expect(BloomFilter.contains(bloom, topic as Uint8Array)).toBe(true);
		});

		it("builds bloom filter from multiple logs", () => {
			const logs = Array.from({ length: 10 }, (_, i) =>
				create({
					address: Address.from(`0x000000000000000000000000000000000000000${i}`),
					topics: [Hash.from(`0x${i.toString(16).padStart(64, "0")}`)],
					data: new Uint8Array([i]),
				}),
			);

			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

			for (const log of logs) {
				BloomFilter.add(bloom, log.address as Uint8Array);
				for (const topic of log.topics) {
					BloomFilter.add(bloom, topic as Uint8Array);
				}
			}

			for (const log of logs) {
				expect(BloomFilter.contains(bloom, log.address as Uint8Array)).toBe(true);
				expect(BloomFilter.contains(bloom, log.topics[0] as Uint8Array)).toBe(true);
			}
		});

		it("handles logs with multiple topics", () => {
			const log = create({
				address: Address.from("0x0000000000000000000000000000000000000001"),
				topics: [
					Hash.from("0x0000000000000000000000000000000000000000000000000000000000000010"),
					Hash.from("0x0000000000000000000000000000000000000000000000000000000000000011"),
					Hash.from("0x0000000000000000000000000000000000000000000000000000000000000012"),
				],
				data: new Uint8Array([1]),
			});

			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(bloom, log.address as Uint8Array);
			for (const topic of log.topics) {
				BloomFilter.add(bloom, topic as Uint8Array);
			}

			expect(BloomFilter.contains(bloom, log.address as Uint8Array)).toBe(true);
			for (const topic of log.topics) {
				expect(BloomFilter.contains(bloom, topic as Uint8Array)).toBe(true);
			}
		});
	});

	describe("Receipt bloom simulation", () => {
		it("simulates receipt bloom with multiple logs", () => {
			const logs = [
				create({
					address: Address.from("0x0000000000000000000000000000000000000001"),
					topics: [Hash.from("0x0000000000000000000000000000000000000000000000000000000000000010")],
					data: new Uint8Array([1]),
				}),
				create({
					address: Address.from("0x0000000000000000000000000000000000000002"),
					topics: [Hash.from("0x0000000000000000000000000000000000000000000000000000000000000020")],
					data: new Uint8Array([2]),
				}),
				create({
					address: Address.from("0x0000000000000000000000000000000000000003"),
					topics: [Hash.from("0x0000000000000000000000000000000000000000000000000000000000000030")],
					data: new Uint8Array([3]),
				}),
			];

			const receiptBloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

			for (const log of logs) {
				BloomFilter.add(receiptBloom, log.address as Uint8Array);
				for (const topic of log.topics) {
					BloomFilter.add(receiptBloom, topic as Uint8Array);
				}
			}

			for (const log of logs) {
				expect(BloomFilter.contains(receiptBloom, log.address as Uint8Array)).toBe(true);
			}
		});

		it("queries against receipt bloom", () => {
			const logs = Array.from({ length: 5 }, (_, i) =>
				create({
					address: Address.from(`0x000000000000000000000000000000000000000${i + 1}`),
					topics: [Hash.from(`0x${(i + 1).toString(16).padStart(64, "0")}`)],
					data: new Uint8Array([i + 1]),
				}),
			);

			const receiptBloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			for (const log of logs) {
				BloomFilter.add(receiptBloom, log.address as Uint8Array);
				for (const topic of log.topics) {
					BloomFilter.add(receiptBloom, topic as Uint8Array);
				}
			}

			const queryAddr = Address.from("0x0000000000000000000000000000000000000003");
			const shouldCheck = BloomFilter.contains(receiptBloom, queryAddr as Uint8Array);

			expect(shouldCheck).toBe(true);

			const actualLogs = filterLogs(logs, { address: queryAddr });
			expect(actualLogs.length).toBe(1);
			expect(actualLogs[0]?.data[0]).toBe(3);
		});

		it("rejects query with bloom miss", () => {
			const logs = Array.from({ length: 5 }, (_, i) =>
				create({
					address: Address.from(`0x000000000000000000000000000000000000000${i + 1}`),
					topics: [Hash.from(`0x${(i + 1).toString(16).padStart(64, "0")}`)],
					data: new Uint8Array([i + 1]),
				}),
			);

			const receiptBloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			for (const log of logs) {
				BloomFilter.add(receiptBloom, log.address as Uint8Array);
				for (const topic of log.topics) {
					BloomFilter.add(receiptBloom, topic as Uint8Array);
				}
			}

			const queryAddr = Address.from("0x000000000000000000000000000000000000000a");
			const shouldCheck = BloomFilter.contains(receiptBloom, queryAddr as Uint8Array);

			if (!shouldCheck) {
				const actualLogs = filterLogs(logs, { address: queryAddr });
				expect(actualLogs.length).toBe(0);
			}
		});
	});

	describe("Block bloom simulation", () => {
		it("combines receipt blooms into block bloom", () => {
			const receipt1Logs = [
				create({
					address: Address.from("0x0000000000000000000000000000000000000001"),
					topics: [Hash.from("0x0000000000000000000000000000000000000000000000000000000000000010")],
					data: new Uint8Array([1]),
				}),
			];

			const receipt2Logs = [
				create({
					address: Address.from("0x0000000000000000000000000000000000000002"),
					topics: [Hash.from("0x0000000000000000000000000000000000000000000000000000000000000020")],
					data: new Uint8Array([2]),
				}),
			];

			const receipt1Bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			for (const log of receipt1Logs) {
				BloomFilter.add(receipt1Bloom, log.address as Uint8Array);
				for (const topic of log.topics) {
					BloomFilter.add(receipt1Bloom, topic as Uint8Array);
				}
			}

			const receipt2Bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			for (const log of receipt2Logs) {
				BloomFilter.add(receipt2Bloom, log.address as Uint8Array);
				for (const topic of log.topics) {
					BloomFilter.add(receipt2Bloom, topic as Uint8Array);
				}
			}

			const blockBloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.merge(blockBloom, receipt1Bloom);
			BloomFilter.merge(blockBloom, receipt2Bloom);

			for (const log of [...receipt1Logs, ...receipt2Logs]) {
				expect(BloomFilter.contains(blockBloom, log.address as Uint8Array)).toBe(true);
			}
		});
	});

	describe("Performance optimization scenario", () => {
		it("demonstrates bloom filter reducing checks", () => {
			const totalLogs = 1000;
			const matchingLogs = 10;

			const targetAddr = Address.from("0x0000000000000000000000000000000000000001");

			const logs = Array.from({ length: totalLogs }, (_, i) =>
				create({
					address: i < matchingLogs ? targetAddr : Address.from(`0x000000000000000000000000000000000000000${(i % 10) + 2}`),
					topics: [Hash.from(`0x${i.toString(16).padStart(64, "0")}`)],
					data: new Uint8Array([i % 256]),
				}),
			);

			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			for (const log of logs.slice(0, matchingLogs)) {
				BloomFilter.add(bloom, log.address as Uint8Array);
			}

			let bloomChecks = 0;
			let fullChecks = 0;

			for (const log of logs) {
				bloomChecks++;
				if (BloomFilter.contains(bloom, log.address as Uint8Array)) {
					fullChecks++;
				}
			}

			expect(bloomChecks).toBe(totalLogs);
			expect(fullChecks).toBeLessThan(totalLogs);
			expect(fullChecks).toBeGreaterThanOrEqual(matchingLogs);

			const actualMatches = logs.filter((log) => log.address === targetAddr);
			expect(actualMatches.length).toBe(matchingLogs);
		});
	});
});
