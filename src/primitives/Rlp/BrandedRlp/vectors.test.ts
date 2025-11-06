/**
 * RLP Ethereum Test Vectors
 *
 * Tests based on official Ethereum RLP test vectors and edge cases
 * from the Ethereum Yellow Paper specification.
 */

import { describe, expect, it } from "vitest";
import * as Rlp from "../index.js";

describe("RLP Ethereum Test Vectors", () => {
	describe("Official Ethereum test vectors", () => {
		it("encodes empty string", () => {
			const input = new Uint8Array([]);
			const encoded = Rlp.encodeBytes(input);
			expect(encoded).toEqual(new Uint8Array([0x80]));
		});

		it("encodes dog", () => {
			const input = new TextEncoder().encode("dog");
			const encoded = Rlp.encodeBytes(input);
			expect(encoded).toEqual(new Uint8Array([0x83, 0x64, 0x6f, 0x67]));
		});

		it("encodes cat and dog list", () => {
			const cat = new TextEncoder().encode("cat");
			const dog = new TextEncoder().encode("dog");
			const encoded = Rlp.encodeList([cat, dog]);
			expect(encoded).toEqual(
				new Uint8Array([0xc8, 0x83, 0x63, 0x61, 0x74, 0x83, 0x64, 0x6f, 0x67]),
			);
		});

		it("encodes empty list", () => {
			const encoded = Rlp.encodeList([]);
			expect(encoded).toEqual(new Uint8Array([0xc0]));
		});

		it("encodes integer 0", () => {
			const input = new Uint8Array([]);
			const encoded = Rlp.encodeBytes(input);
			expect(encoded).toEqual(new Uint8Array([0x80]));
		});

		it("encodes integer 1", () => {
			const input = new Uint8Array([0x01]);
			const encoded = Rlp.encodeBytes(input);
			expect(encoded).toEqual(new Uint8Array([0x01]));
		});

		it("encodes integer 127", () => {
			const input = new Uint8Array([0x7f]);
			const encoded = Rlp.encodeBytes(input);
			expect(encoded).toEqual(new Uint8Array([0x7f]));
		});

		it("encodes integer 128", () => {
			const input = new Uint8Array([0x80]);
			const encoded = Rlp.encodeBytes(input);
			expect(encoded).toEqual(new Uint8Array([0x81, 0x80]));
		});

		it("encodes integer 256", () => {
			const input = new Uint8Array([0x01, 0x00]);
			const encoded = Rlp.encodeBytes(input);
			expect(encoded).toEqual(new Uint8Array([0x82, 0x01, 0x00]));
		});

		it("encodes Lorem ipsum string", () => {
			const text = "Lorem ipsum dolor sit amet, consectetur adipisicing elit";
			const input = new TextEncoder().encode(text);
			const encoded = Rlp.encodeBytes(input);
			expect(encoded[0]).toBe(0xb8);
			expect(encoded[1]).toBe(text.length);
		});

		it("encodes set theoretical representation of three", () => {
			// [ [], [[]], [ [], [[]] ] ]
			const empty: any[] = [];
			const one = [empty];
			const two = [empty, one];
			const three = [empty, one, two];
			const encoded = Rlp.encode(three);

			// Expected: 0xc7 0xc0 0xc1 0xc0 0xc3 0xc0 0xc1 0xc0
			expect(encoded).toEqual(
				new Uint8Array([0xc7, 0xc0, 0xc1, 0xc0, 0xc3, 0xc0, 0xc1, 0xc0]),
			);
		});
	});

	describe("Boundary values", () => {
		it("handles 55-byte string boundary", () => {
			const input = new Uint8Array(55).fill(0x61);
			const encoded = Rlp.encodeBytes(input);
			expect(encoded[0]).toBe(0x80 + 55);
			expect(encoded.length).toBe(56);
		});

		it("handles 56-byte string boundary", () => {
			const input = new Uint8Array(56).fill(0x61);
			const encoded = Rlp.encodeBytes(input);
			expect(encoded[0]).toBe(0xb8);
			expect(encoded[1]).toBe(56);
			expect(encoded.length).toBe(58);
		});

		it("handles 255-byte string", () => {
			const input = new Uint8Array(255).fill(0x61);
			const encoded = Rlp.encodeBytes(input);
			expect(encoded[0]).toBe(0xb8);
			expect(encoded[1]).toBe(255);
			expect(encoded.length).toBe(257);
		});

		it("handles 256-byte string", () => {
			const input = new Uint8Array(256).fill(0x61);
			const encoded = Rlp.encodeBytes(input);
			expect(encoded[0]).toBe(0xb9);
			expect(encoded[1]).toBe(0x01);
			expect(encoded[2]).toBe(0x00);
			expect(encoded.length).toBe(259);
		});

		it("handles large 10000-byte string", () => {
			const input = new Uint8Array(10000).fill(0xff);
			const encoded = Rlp.encodeBytes(input);
			const decoded = Rlp.decode(encoded);
			expect(decoded.data.type).toBe("bytes");
			if (decoded.data.type === "bytes") {
				expect(decoded.data.value.length).toBe(10000);
				expect(decoded.data.value.every((b) => b === 0xff)).toBe(true);
			}
		});
	});

	describe("List boundary values", () => {
		it("handles short list form (< 56 bytes payload)", () => {
			// Each single byte < 0x80 encodes as itself: 1 byte
			// 55 items * 1 byte = 55 bytes (uses short form)
			const items = Array.from({ length: 55 }, () => new Uint8Array([0x01]));
			const encoded = Rlp.encodeList(items);
			expect(encoded[0]).toBeLessThanOrEqual(0xf7);
			expect(encoded[0]).toBe(0xc0 + 55);
		});

		it("handles long list form (>= 56 bytes payload)", () => {
			// 56 items * 1 byte = 56 bytes (uses long form)
			const items = Array.from({ length: 56 }, () => new Uint8Array([0x01]));
			const encoded = Rlp.encodeList(items);
			expect(encoded[0]).toBeGreaterThanOrEqual(0xf8);
			expect(encoded[0]).toBe(0xf8);
			expect(encoded[1]).toBe(56);
		});
	});

	describe("Special byte values", () => {
		it("handles byte 0x00", () => {
			const input = new Uint8Array([0x00]);
			const encoded = Rlp.encodeBytes(input);
			expect(encoded).toEqual(new Uint8Array([0x00]));
		});

		it("handles byte 0x7f", () => {
			const input = new Uint8Array([0x7f]);
			const encoded = Rlp.encodeBytes(input);
			expect(encoded).toEqual(new Uint8Array([0x7f]));
		});

		it("handles byte 0x80", () => {
			const input = new Uint8Array([0x80]);
			const encoded = Rlp.encodeBytes(input);
			expect(encoded).toEqual(new Uint8Array([0x81, 0x80]));
		});

		it("handles byte 0xff", () => {
			const input = new Uint8Array([0xff]);
			const encoded = Rlp.encodeBytes(input);
			expect(encoded).toEqual(new Uint8Array([0x81, 0xff]));
		});

		it("handles all single bytes [0x00-0x7f]", () => {
			for (let i = 0; i <= 0x7f; i++) {
				const input = new Uint8Array([i]);
				const encoded = Rlp.encodeBytes(input);
				expect(encoded).toEqual(new Uint8Array([i]));
			}
		});

		it("handles all single bytes [0x80-0xff]", () => {
			for (let i = 0x80; i <= 0xff; i++) {
				const input = new Uint8Array([i]);
				const encoded = Rlp.encodeBytes(input);
				expect(encoded).toEqual(new Uint8Array([0x81, i]));
			}
		});
	});

	describe("Nested structures", () => {
		it("handles deeply nested empty lists", () => {
			let nested: any = [];
			for (let i = 0; i < 10; i++) {
				nested = [nested];
			}
			const encoded = Rlp.encode(nested);
			const decoded = Rlp.decode(encoded);
			expect(decoded.data.type).toBe("list");
		});

		it("handles alternating bytes and lists", () => {
			const structure = [
				new Uint8Array([0x01]),
				[new Uint8Array([0x02])],
				new Uint8Array([0x03]),
				[new Uint8Array([0x04])],
			];
			const encoded = Rlp.encode(structure);
			const decoded = Rlp.decode(encoded);
			expect(decoded.data.type).toBe("list");
			if (decoded.data.type === "list") {
				expect(decoded.data.value.length).toBe(4);
			}
		});

		it("handles list of empty strings", () => {
			const structure = [
				new Uint8Array([]),
				new Uint8Array([]),
				new Uint8Array([]),
			];
			const encoded = Rlp.encode(structure);
			const decoded = Rlp.decode(encoded);
			expect(decoded.data.type).toBe("list");
			if (decoded.data.type === "list") {
				expect(decoded.data.value.length).toBe(3);
				for (const item of decoded.data.value) {
					expect(item.type).toBe("bytes");
					if (item.type === "bytes") {
						expect(item.value.length).toBe(0);
					}
				}
			}
		});

		it("handles list of empty lists", () => {
			const structure = [[], [], []];
			const encoded = Rlp.encode(structure);
			const decoded = Rlp.decode(encoded);
			expect(decoded.data.type).toBe("list");
			if (decoded.data.type === "list") {
				expect(decoded.data.value.length).toBe(3);
				for (const item of decoded.data.value) {
					expect(item.type).toBe("list");
					if (item.type === "list") {
						expect(item.value.length).toBe(0);
					}
				}
			}
		});
	});

	describe("Ethereum transaction-like structures", () => {
		it("encodes legacy transaction structure", () => {
			const nonce = new Uint8Array([0x09]);
			const gasPrice = new Uint8Array([0x04, 0xa8, 0x17, 0xc8, 0x00]);
			const gasLimit = new Uint8Array([0x52, 0x08]);
			const to = new Uint8Array(20).fill(0x11);
			const value = new Uint8Array([
				0x0d, 0xe0, 0xb6, 0xb3, 0xa7, 0x64, 0x00, 0x00,
			]);
			const data = new Uint8Array([]);
			const v = new Uint8Array([0x1b]);
			const r = new Uint8Array(32).fill(0xaa);
			const s = new Uint8Array(32).fill(0xbb);

			const tx = [nonce, gasPrice, gasLimit, to, value, data, v, r, s];
			const encoded = Rlp.encode(tx);
			expect(encoded.length).toBeGreaterThan(0);

			const decoded = Rlp.decode(encoded);
			expect(decoded.data.type).toBe("list");
			if (decoded.data.type === "list") {
				expect(decoded.data.value.length).toBe(9);
			}
		});

		it("encodes EIP-2930 access list", () => {
			const address = new Uint8Array(20).fill(0xaa);
			const storageKey1 = new Uint8Array(32).fill(0x11);
			const storageKey2 = new Uint8Array(32).fill(0x22);
			const accessListItem = [address, [storageKey1, storageKey2]];
			const accessList = [accessListItem];

			const encoded = Rlp.encode(accessList);
			const decoded = Rlp.decode(encoded);
			expect(decoded.data.type).toBe("list");
		});

		it("encodes block header-like structure", () => {
			const parentHash = new Uint8Array(32).fill(0xaa);
			const uncleHash = new Uint8Array(32).fill(0xbb);
			const coinbase = new Uint8Array(20).fill(0xcc);
			const stateRoot = new Uint8Array(32).fill(0xdd);
			const txRoot = new Uint8Array(32).fill(0xee);
			const receiptRoot = new Uint8Array(32).fill(0xff);
			const bloom = new Uint8Array(256).fill(0x00);
			const difficulty = new Uint8Array([0x01, 0x00]);
			const number = new Uint8Array([0x01]);
			const gasLimit = new Uint8Array([0x98, 0x96, 0x80]);
			const gasUsed = new Uint8Array([0x01, 0x23, 0x45]);
			const timestamp = new Uint8Array([0x5f, 0x5e, 0x10, 0x0]);
			const extraData = new Uint8Array([]);
			const mixHash = new Uint8Array(32).fill(0x11);
			const nonce = new Uint8Array([
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x42,
			]);

			const header = [
				parentHash,
				uncleHash,
				coinbase,
				stateRoot,
				txRoot,
				receiptRoot,
				bloom,
				difficulty,
				number,
				gasLimit,
				gasUsed,
				timestamp,
				extraData,
				mixHash,
				nonce,
			];

			const encoded = Rlp.encode(header);
			expect(encoded.length).toBeGreaterThan(0);

			const decoded = Rlp.decode(encoded);
			expect(decoded.data.type).toBe("list");
			if (decoded.data.type === "list") {
				expect(decoded.data.value.length).toBe(15);
			}
		});
	});

	describe("Round-trip with known vectors", () => {
		it("round-trips empty string", () => {
			const original = new Uint8Array([]);
			const encoded = Rlp.encodeBytes(original);
			const decoded = Rlp.decode(encoded);
			expect(decoded.data.type).toBe("bytes");
			if (decoded.data.type === "bytes") {
				expect(decoded.data.value).toEqual(original);
			}
		});

		it("round-trips single byte values", () => {
			for (let i = 0; i <= 255; i++) {
				const original = new Uint8Array([i]);
				const encoded = Rlp.encodeBytes(original);
				const decoded = Rlp.decode(encoded);
				expect(decoded.data.type).toBe("bytes");
				if (decoded.data.type === "bytes") {
					expect(decoded.data.value).toEqual(original);
				}
			}
		});

		it("round-trips various string lengths", () => {
			const lengths = [0, 1, 10, 55, 56, 100, 255, 256, 1000, 5000];
			for (const length of lengths) {
				const original = new Uint8Array(length).fill(0x42);
				const encoded = Rlp.encodeBytes(original);
				const decoded = Rlp.decode(encoded);
				expect(decoded.data.type).toBe("bytes");
				if (decoded.data.type === "bytes") {
					expect(decoded.data.value.length).toBe(length);
					expect(decoded.data.value).toEqual(original);
				}
			}
		});

		it("round-trips complex nested structures", () => {
			const structures = [
				[],
				[[]],
				[[], []],
				[new Uint8Array([0x01])],
				[new Uint8Array([0x01]), new Uint8Array([0x02])],
				[new Uint8Array([0x01]), [new Uint8Array([0x02])]],
				[[new Uint8Array([0x01])], [new Uint8Array([0x02])]],
				[
					new Uint8Array([0x01]),
					[new Uint8Array([0x02]), [new Uint8Array([0x03])]],
				],
			];

			for (const structure of structures) {
				const encoded = Rlp.encode(structure);
				const decoded = Rlp.decode(encoded);
				expect(decoded.data.type).toBe("list");
			}
		});
	});

	describe("Error cases from Ethereum tests", () => {
		it("rejects invalid length prefix", () => {
			const invalid = new Uint8Array([0xbf, 0x00, 0x00]);
			expect(() => Rlp.decode(invalid)).toThrow();
		});

		it("rejects oversized length prefix", () => {
			const invalid = new Uint8Array([
				0xb9,
				0xff,
				0xff,
				...new Uint8Array(100),
			]);
			expect(() => Rlp.decode(invalid)).toThrow();
		});

		it("rejects non-minimal encoding", () => {
			const invalid = new Uint8Array([0x81, 0x00]);
			expect(() => Rlp.decode(invalid)).toThrow();
		});

		it("rejects wrong short form", () => {
			const invalid = new Uint8Array([0xb8, 0x0a, ...new Uint8Array(10)]);
			expect(() => Rlp.decode(invalid)).toThrow();
		});

		it("rejects leading zeros in length", () => {
			const invalid = new Uint8Array([0xb9, 0x00, 0x38, ...new Uint8Array(56)]);
			expect(() => Rlp.decode(invalid)).toThrow();
		});
	});
});
