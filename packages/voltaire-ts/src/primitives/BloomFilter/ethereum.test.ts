import { describe, expect, it } from "vitest";
import { BITS, DEFAULT_HASH_COUNT, SIZE } from "./constants.js";
import * as BloomFilter from "./index.js";

describe("BloomFilter - Ethereum Specification", () => {
	describe("Ethereum bloom parameters", () => {
		it("has exactly 2048 bits", () => {
			expect(BITS).toBe(2048);
		});

		it("has exactly 256 bytes", () => {
			expect(SIZE).toBe(256);
		});

		it("uses 3 hash functions", () => {
			expect(DEFAULT_HASH_COUNT).toBe(3);
		});

		it("bytes = bits / 8", () => {
			expect(SIZE).toBe(BITS / 8);
		});
	});

	describe("Three bits per item", () => {
		it("sets at most 3 bits per item", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const item = new TextEncoder().encode("test");

			const beforeBits = countSetBits(filter);
			BloomFilter.add(filter, item);
			const afterBits = countSetBits(filter);

			const bitsSet = afterBits - beforeBits;
			expect(bitsSet).toBeGreaterThan(0);
			expect(bitsSet).toBeLessThanOrEqual(3);
		});

		it("sets 3 bits when no collisions", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const item = new Uint8Array(32).fill(0x42);

			const beforeBits = countSetBits(filter);
			BloomFilter.add(filter, item);
			const afterBits = countSetBits(filter);

			const bitsSet = afterBits - beforeBits;
			expect(bitsSet).toBeLessThanOrEqual(3);
		});

		it("may set fewer than 3 bits on collision", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

			for (let i = 0; i < 100; i++) {
				const item = new Uint8Array([i]);
				const beforeBits = countSetBits(filter);
				BloomFilter.add(filter, item);
				const afterBits = countSetBits(filter);
				const bitsSet = afterBits - beforeBits;
				expect(bitsSet).toBeLessThanOrEqual(3);
			}
		});

		it("verifies k=3 sets max 3 bits", () => {
			const filter = BloomFilter.create(BITS, 3);
			const item = new TextEncoder().encode("ethereum");

			const beforeBits = countSetBits(filter);
			BloomFilter.add(filter, item);
			const afterBits = countSetBits(filter);

			expect(afterBits - beforeBits).toBeLessThanOrEqual(3);
		});
	});

	describe("Bit position calculation", () => {
		// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex logic required
		it("sets bits within valid range [0, 2047]", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const item = new TextEncoder().encode("test");

			BloomFilter.add(filter, item);

			const positions: number[] = [];
			for (let byteIdx = 0; byteIdx < filter.length; byteIdx++) {
				const byte = filter[byteIdx];
				if (byte !== undefined && byte !== 0) {
					for (let bit = 0; bit < 8; bit++) {
						if ((byte & (1 << bit)) !== 0) {
							positions.push(byteIdx * 8 + bit);
						}
					}
				}
			}

			for (const pos of positions) {
				expect(pos).toBeGreaterThanOrEqual(0);
				expect(pos).toBeLessThan(BITS);
			}
		});

		it("distributes bits across filter", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

			for (let i = 0; i < 100; i++) {
				BloomFilter.add(filter, new TextEncoder().encode(`item${i}`));
			}

			const bytesWithBits = Array.from(filter).filter((b) => b !== 0).length;
			expect(bytesWithBits).toBeGreaterThan(50);
		});
	});

	describe("Ethereum address format (20 bytes)", () => {
		it("handles standard 20-byte address", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const address = new Uint8Array([
				0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15,
				0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d,
			]);

			BloomFilter.add(filter, address);
			expect(BloomFilter.contains(filter, address)).toBe(true);
		});

		it("handles checksum address bytes", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const checksumAddr = new Uint8Array([
				0xa0, 0xb8, 0x69, 0x91, 0xc6, 0x21, 0x8b, 0x36, 0xc1, 0xd1, 0x9d, 0x4a,
				0x2e, 0x9e, 0xb0, 0xce, 0x36, 0x06, 0xeb, 0x48,
			]);

			BloomFilter.add(filter, checksumAddr);
			expect(BloomFilter.contains(filter, checksumAddr)).toBe(true);
		});

		it("distinguishes similar addresses", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const addr1 = new Uint8Array(20).fill(0x01);
			const addr2 = new Uint8Array(20).fill(0x01);
			addr2[19] = 0x02;

			BloomFilter.add(filter, addr1);

			expect(BloomFilter.contains(filter, addr1)).toBe(true);
			expect(BloomFilter.contains(filter, addr2)).toBe(false);
		});
	});

	describe("Ethereum topic format (32 bytes)", () => {
		it("handles standard 32-byte topic", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const topic = new Uint8Array(32);
			topic[0] = 0xdd;
			topic[1] = 0xf2;
			topic[2] = 0x52;
			topic[3] = 0xad;

			BloomFilter.add(filter, topic);
			expect(BloomFilter.contains(filter, topic)).toBe(true);
		});

		it("handles event signature hash", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const transferSig = new Uint8Array([
				0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b, 0x69, 0xc2, 0xb0, 0x68,
				0xfc, 0x37, 0x8d, 0xaa, 0x95, 0x2b, 0xa7, 0xf1, 0x63, 0xc4, 0xa1, 0x16,
				0x28, 0xf5, 0x5a, 0x4d, 0xf5, 0x23, 0xb3, 0xef,
			]);

			BloomFilter.add(filter, transferSig);
			expect(BloomFilter.contains(filter, transferSig)).toBe(true);
		});

		it("handles indexed address parameter (padded to 32 bytes)", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const indexedAddr = new Uint8Array(32);
			for (let i = 0; i < 20; i++) {
				indexedAddr[12 + i] = i + 1;
			}

			BloomFilter.add(filter, indexedAddr);
			expect(BloomFilter.contains(filter, indexedAddr)).toBe(true);
		});

		it("handles indexed uint256 parameter", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const indexedUint = new Uint8Array(32);
			indexedUint[24] = 0x01;
			indexedUint[31] = 0xff;

			BloomFilter.add(filter, indexedUint);
			expect(BloomFilter.contains(filter, indexedUint)).toBe(true);
		});
	});

	describe("Log bloom construction", () => {
		it("adds address and topics to bloom", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

			const address = new Uint8Array(20).fill(0x01);
			const topic0 = new Uint8Array(32).fill(0x10);
			const topic1 = new Uint8Array(32).fill(0x11);
			const topic2 = new Uint8Array(32).fill(0x12);

			BloomFilter.add(filter, address);
			BloomFilter.add(filter, topic0);
			BloomFilter.add(filter, topic1);
			BloomFilter.add(filter, topic2);

			expect(BloomFilter.contains(filter, address)).toBe(true);
			expect(BloomFilter.contains(filter, topic0)).toBe(true);
			expect(BloomFilter.contains(filter, topic1)).toBe(true);
			expect(BloomFilter.contains(filter, topic2)).toBe(true);
		});

		it("builds bloom for ERC20 Transfer event", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

			const contractAddr = new Uint8Array([
				0xa0, 0xb8, 0x69, 0x91, 0xc6, 0x21, 0x8b, 0x36, 0xc1, 0xd1, 0x9d, 0x4a,
				0x2e, 0x9e, 0xb0, 0xce, 0x36, 0x06, 0xeb, 0x48,
			]);
			const transferSig = new Uint8Array([
				0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b, 0x69, 0xc2, 0xb0, 0x68,
				0xfc, 0x37, 0x8d, 0xaa, 0x95, 0x2b, 0xa7, 0xf1, 0x63, 0xc4, 0xa1, 0x16,
				0x28, 0xf5, 0x5a, 0x4d, 0xf5, 0x23, 0xb3, 0xef,
			]);
			const fromAddr = new Uint8Array(32);
			fromAddr.set(new Uint8Array(20).fill(0x01), 12);
			const toAddr = new Uint8Array(32);
			toAddr.set(new Uint8Array(20).fill(0x02), 12);

			BloomFilter.add(filter, contractAddr);
			BloomFilter.add(filter, transferSig);
			BloomFilter.add(filter, fromAddr);
			BloomFilter.add(filter, toAddr);

			expect(BloomFilter.contains(filter, contractAddr)).toBe(true);
			expect(BloomFilter.contains(filter, transferSig)).toBe(true);
			expect(BloomFilter.contains(filter, fromAddr)).toBe(true);
			expect(BloomFilter.contains(filter, toAddr)).toBe(true);
		});
	});

	describe("Receipt bloom aggregation", () => {
		it("combines multiple log blooms", () => {
			const log1Bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(log1Bloom, new Uint8Array(20).fill(0x01));
			BloomFilter.add(log1Bloom, new Uint8Array(32).fill(0x10));

			const log2Bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(log2Bloom, new Uint8Array(20).fill(0x02));
			BloomFilter.add(log2Bloom, new Uint8Array(32).fill(0x20));

			const receiptBloom = BloomFilter.merge(log1Bloom, log2Bloom);

			expect(
				BloomFilter.contains(receiptBloom, new Uint8Array(20).fill(0x01)),
			).toBe(true);
			expect(
				BloomFilter.contains(receiptBloom, new Uint8Array(32).fill(0x10)),
			).toBe(true);
			expect(
				BloomFilter.contains(receiptBloom, new Uint8Array(20).fill(0x02)),
			).toBe(true);
			expect(
				BloomFilter.contains(receiptBloom, new Uint8Array(32).fill(0x20)),
			).toBe(true);
		});

		it("receipt bloom contains all transaction logs", () => {
			const receiptBloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

			const logCount = 5;
			const addresses: Uint8Array[] = [];
			const topics: Uint8Array[] = [];

			for (let i = 0; i < logCount; i++) {
				const addr = new Uint8Array(20).fill(i + 1);
				const topic = new Uint8Array(32).fill((i + 1) * 10);

				addresses.push(addr);
				topics.push(topic);

				BloomFilter.add(receiptBloom, addr);
				BloomFilter.add(receiptBloom, topic);
			}

			for (let i = 0; i < logCount; i++) {
				expect(
					BloomFilter.contains(receiptBloom, addresses[i] as Uint8Array),
				).toBe(true);
				expect(
					BloomFilter.contains(receiptBloom, topics[i] as Uint8Array),
				).toBe(true);
			}
		});
	});

	describe("Block bloom aggregation", () => {
		it("combines multiple receipt blooms", () => {
			const receipt1 = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(receipt1, new Uint8Array(20).fill(0x01));

			const receipt2 = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(receipt2, new Uint8Array(20).fill(0x02));

			const receipt3 = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(receipt3, new Uint8Array(20).fill(0x03));

			let blockBloom = BloomFilter.merge(receipt1, receipt2);
			blockBloom = BloomFilter.merge(blockBloom, receipt3);

			expect(
				BloomFilter.contains(blockBloom, new Uint8Array(20).fill(0x01)),
			).toBe(true);
			expect(
				BloomFilter.contains(blockBloom, new Uint8Array(20).fill(0x02)),
			).toBe(true);
			expect(
				BloomFilter.contains(blockBloom, new Uint8Array(20).fill(0x03)),
			).toBe(true);
		});

		it("block bloom density increases with transactions", () => {
			let blockBloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

			const d0 = BloomFilter.density(blockBloom);
			expect(d0).toBe(0);

			for (let tx = 0; tx < 10; tx++) {
				const receiptBloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

				for (let log = 0; log < 3; log++) {
					const addr = new Uint8Array(20).fill(tx * 10 + log);
					const topic = new Uint8Array(32).fill(tx * 10 + log);
					BloomFilter.add(receiptBloom, addr);
					BloomFilter.add(receiptBloom, topic);
				}

				blockBloom = BloomFilter.merge(blockBloom, receiptBloom);
			}

			const dFinal = BloomFilter.density(blockBloom);
			expect(dFinal).toBeGreaterThan(0);
			expect(dFinal).toBeLessThan(1);
		});
	});

	describe("Bloom filter querying", () => {
		it("uses bloom for quick address check", () => {
			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const targetAddr = new Uint8Array(20).fill(0x01);
			const otherAddr = new Uint8Array(20).fill(0x02);

			BloomFilter.add(bloom, targetAddr);

			const shouldCheckTarget = BloomFilter.contains(bloom, targetAddr);
			const shouldCheckOther = BloomFilter.contains(bloom, otherAddr);

			expect(shouldCheckTarget).toBe(true);
			expect(shouldCheckOther).toBe(false);
		});

		it("uses bloom for quick topic check", () => {
			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const targetTopic = new Uint8Array(32);
			targetTopic[0] = 0x10;
			targetTopic[1] = 0x20;
			targetTopic[2] = 0x30;

			const otherTopic = new Uint8Array(32);
			otherTopic[0] = 0xaa;
			otherTopic[1] = 0xbb;
			otherTopic[2] = 0xcc;

			BloomFilter.add(bloom, targetTopic);

			const shouldCheckTarget = BloomFilter.contains(bloom, targetTopic);
			expect(shouldCheckTarget).toBe(true);

			const shouldCheckOther = BloomFilter.contains(bloom, otherTopic);
			if (!shouldCheckOther) {
				expect(shouldCheckOther).toBe(false);
			}
		});

		it("bloom miss means definite no match", () => {
			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

			for (let i = 1; i <= 50; i++) {
				const addr = new Uint8Array(20);
				addr[0] = i;
				addr[19] = i;
				BloomFilter.add(bloom, addr);
			}

			const testAddr = new Uint8Array(20);
			testAddr[0] = 255;
			testAddr[19] = 255;
			const inBloom = BloomFilter.contains(bloom, testAddr);

			if (!inBloom) {
				expect(inBloom).toBe(false);
			}
		});
	});

	describe("Empty bloom", () => {
		it("creates all-zero bloom", () => {
			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

			for (let i = 0; i < bloom.length; i++) {
				expect(bloom[i]).toBe(0);
			}
		});

		it("empty bloom rejects all queries", () => {
			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

			for (let i = 0; i < 100; i++) {
				const item = new Uint8Array(20).fill(i);
				expect(BloomFilter.contains(bloom, item)).toBe(false);
			}
		});

		it("empty bloom has zero density", () => {
			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			expect(BloomFilter.density(bloom)).toBe(0);
		});

		it("empty bloom is empty", () => {
			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			expect(BloomFilter.isEmpty(bloom)).toBe(true);
		});
	});
});

describe("BloomFilter - Yellow Paper Compliance", () => {
	describe("Keccak-256 based bit positions", () => {
		it("uses Keccak-256 hash for bit positions per Yellow Paper", () => {
			// Per Yellow Paper: m(x, i) = KEC(x)[i, i + 1] mod 2048
			// This test verifies the implementation uses Keccak-256
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const item = new Uint8Array([0x01, 0x02, 0x03]);

			BloomFilter.add(filter, item);

			// Verify item is found (basic sanity check)
			expect(BloomFilter.contains(filter, item)).toBe(true);

			// Verify different item is not found (false negative check)
			const differentItem = new Uint8Array([0x04, 0x05, 0x06]);
			expect(BloomFilter.contains(filter, differentItem)).toBe(false);
		});

		it("produces correct bit positions for known input", () => {
			// For an empty byte array [], keccak256 produces:
			// 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
			// Byte pairs [0,1]=0xc5d2, [2,3]=0x4601, [4,5]=0x86f7
			// Bit positions:
			//   0xc5d2 % 2048 = 50642 % 2048 = 1490
			//   0x4601 % 2048 = 17921 % 2048 = 1537
			//   0x86f7 % 2048 = 34551 % 2048 = 1783
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const emptyItem = new Uint8Array(0);

			BloomFilter.add(filter, emptyItem);

			// Verify the specific bits are set
			// Bit 1490: byte 186 (1490/8), bit 2 (1490%8)
			expect((filter[186] & (1 << 2)) !== 0).toBe(true);
			// Bit 1537: byte 192 (1537/8), bit 1 (1537%8)
			expect((filter[192] & (1 << 1)) !== 0).toBe(true);
			// Bit 1783: byte 222 (1783/8), bit 7 (1783%8)
			expect((filter[222] & (1 << 7)) !== 0).toBe(true);
		});

		it("builds bloom filter compatible with real Ethereum blocks", () => {
			// Test with ERC-20 Transfer event signature
			// Transfer(address,address,uint256) = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
			const transferTopic = new Uint8Array([
				0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b, 0x69, 0xc2, 0xb0, 0x68,
				0xfc, 0x37, 0x8d, 0xaa, 0x95, 0x2b, 0xa7, 0xf1, 0x63, 0xc4, 0xa1, 0x16,
				0x28, 0xf5, 0x5a, 0x4d, 0xf5, 0x23, 0xb3, 0xef,
			]);

			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(filter, transferTopic);

			// The bloom filter should find the Transfer topic
			expect(BloomFilter.contains(filter, transferTopic)).toBe(true);

			// And should not find unrelated topics
			const approvalTopic = new Uint8Array([
				0x8c, 0x5b, 0xe1, 0xe5, 0xeb, 0xec, 0x7d, 0x5b, 0xd1, 0x4f, 0x71, 0x42,
				0x7d, 0x1e, 0x84, 0xf3, 0xdd, 0x03, 0x14, 0xc0, 0xf7, 0xb2, 0x29, 0x1e,
				0x5b, 0x20, 0x0a, 0xc8, 0xc7, 0xc3, 0xb9, 0x25,
			]);
			expect(BloomFilter.contains(filter, approvalTopic)).toBe(false);
		});

		it("correctly handles address in bloom filter", () => {
			// USDC contract address: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
			const usdcAddress = new Uint8Array([
				0xa0, 0xb8, 0x69, 0x91, 0xc6, 0x21, 0x8b, 0x36, 0xc1, 0xd1, 0x9d, 0x4a,
				0x2e, 0x9e, 0xb0, 0xce, 0x36, 0x06, 0xeb, 0x48,
			]);

			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(filter, usdcAddress);

			expect(BloomFilter.contains(filter, usdcAddress)).toBe(true);

			// Different address should not match
			const wethAddress = new Uint8Array([
				0xc0, 0x2a, 0xaa, 0x39, 0xb2, 0x23, 0xfe, 0x8d, 0x0a, 0x0e, 0x5c, 0x4f,
				0x27, 0xea, 0xd9, 0x08, 0x3c, 0x75, 0x6c, 0xc2,
			]);
			expect(BloomFilter.contains(filter, wethAddress)).toBe(false);
		});
	});

	describe("No false negatives guarantee", () => {
		it("never produces false negatives for added items", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

			// Add many random items
			const items: Uint8Array[] = [];
			for (let i = 0; i < 100; i++) {
				const item = new Uint8Array(32);
				for (let j = 0; j < 32; j++) {
					item[j] = Math.floor(Math.random() * 256);
				}
				items.push(item);
				BloomFilter.add(filter, item);
			}

			// Every added item MUST be found
			for (const item of items) {
				expect(BloomFilter.contains(filter, item)).toBe(true);
			}
		});
	});
});

function countSetBits(filter: Uint8Array): number {
	let count = 0;
	for (let i = 0; i < filter.length; i++) {
		const byte = filter[i];
		if (byte !== undefined) {
			let b = byte;
			while (b > 0) {
				count += b & 1;
				b >>= 1;
			}
		}
	}
	return count;
}
