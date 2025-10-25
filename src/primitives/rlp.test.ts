import { describe, test, expect } from "bun:test";
import {
	encode,
	decode,
	encodeList,
	encodeUint,
	toHex,
	fromHex,
	getLength,
	isValid,
	InputTooShort,
	LeadingZeros,
	NonCanonicalSize,
	type RlpDecoded,
} from "./rlp";

/**
 * Test helpers
 */
function hexToBytes(hex: string): Uint8Array {
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < cleanHex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
	}
	return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
	return (
		"0x" +
		Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	);
}

function compareBytes(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

/**
 * Official Ethereum RLP test vectors
 */
describe("RLP Encoding - Official Test Vectors", () => {
	test("empty string", () => {
		const input = new Uint8Array([]);
		const result = encode(input);
		expect(bytesToHex(result)).toBe("0x80");
	});

	test("single byte < 0x7f", () => {
		const input = new Uint8Array([0x00]);
		const result = encode(input);
		expect(bytesToHex(result)).toBe("0x00");
	});

	test("single byte = 0x7f", () => {
		const input = new Uint8Array([0x7f]);
		const result = encode(input);
		expect(bytesToHex(result)).toBe("0x7f");
	});

	test("single byte = 0x80", () => {
		const input = new Uint8Array([0x80]);
		const result = encode(input);
		expect(bytesToHex(result)).toBe("0x8180");
	});

	test('string "dog"', () => {
		const input = new TextEncoder().encode("dog");
		const result = encode(input);
		expect(bytesToHex(result)).toBe("0x83646f67");
	});

	test('list [ "cat", "dog" ]', () => {
		const input = [
			new TextEncoder().encode("cat"),
			new TextEncoder().encode("dog"),
		];
		const result = encodeList(input);
		expect(bytesToHex(result)).toBe("0xc88363617483646f67");
	});

	test("empty list", () => {
		const input: RlpDecoded[] = [];
		const result = encodeList(input);
		expect(bytesToHex(result)).toBe("0xc0");
	});

	test("integer 0", () => {
		const result = encodeUint(0);
		expect(bytesToHex(result)).toBe("0x80");
	});

	test("integer 1", () => {
		const result = encodeUint(1);
		expect(bytesToHex(result)).toBe("0x01");
	});

	test("integer 127", () => {
		const result = encodeUint(127);
		expect(bytesToHex(result)).toBe("0x7f");
	});

	test("integer 128", () => {
		const result = encodeUint(128);
		expect(bytesToHex(result)).toBe("0x8180");
	});

	test("integer 256", () => {
		const result = encodeUint(256);
		expect(bytesToHex(result)).toBe("0x820100");
	});

	test("integer 1024", () => {
		const result = encodeUint(1024);
		expect(bytesToHex(result)).toBe("0x820400");
	});

	test("long string (55 bytes)", () => {
		const input = new Uint8Array(55).fill(0x61); // 'a' repeated 55 times
		const result = encode(input);
		const expected = "0xb7" + "61".repeat(55);
		expect(bytesToHex(result)).toBe(expected);
	});

	test("long string (56 bytes)", () => {
		const input = new Uint8Array(56).fill(0x61); // 'a' repeated 56 times
		const result = encode(input);
		const expected = "0xb838" + "61".repeat(56);
		expect(bytesToHex(result)).toBe(expected);
	});

	test("nested empty lists [ [], [[]], [ [], [[]] ] ]", () => {
		const input: RlpDecoded[] = [[], [[]], [[], [[]]]];
		const result = encodeList(input);
		expect(bytesToHex(result)).toBe("0xc7c0c1c0c3c0c1c0");
	});

	test("list with string and number", () => {
		const input = [
			new TextEncoder().encode("zw"),
			new Uint8Array([0x04]),
			new Uint8Array([0x01]),
		];
		const result = encodeList(input);
		// 'zw' (2 bytes) -> 0x82 0x7a 0x77 (3 bytes)
		// 0x04 (single byte < 0x80) -> 0x04 (1 byte)
		// 0x01 (single byte < 0x80) -> 0x01 (1 byte)
		// Total: 3 + 1 + 1 = 5 bytes
		// List: 0xc0 + 5 = 0xc5
		expect(bytesToHex(result)).toBe("0xc5827a770401");
	});
});

describe("RLP Decoding - Official Test Vectors", () => {
	test("decode empty string", () => {
		const input = hexToBytes("0x80");
		const result = decode(input);
		expect(result).toBeInstanceOf(Uint8Array);
		expect((result as Uint8Array).length).toBe(0);
	});

	test("decode single byte < 0x7f", () => {
		const input = hexToBytes("0x00");
		const result = decode(input);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(compareBytes(result as Uint8Array, new Uint8Array([0x00]))).toBe(
			true,
		);
	});

	test('decode string "dog"', () => {
		const input = hexToBytes("0x83646f67");
		const result = decode(input);
		expect(result).toBeInstanceOf(Uint8Array);
		const text = new TextDecoder().decode(result as Uint8Array);
		expect(text).toBe("dog");
	});

	test('decode list [ "cat", "dog" ]', () => {
		const input = hexToBytes("0xc88363617483646f67");
		const result = decode(input) as RlpDecoded[];
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(2);
		expect(new TextDecoder().decode(result[0] as Uint8Array)).toBe("cat");
		expect(new TextDecoder().decode(result[1] as Uint8Array)).toBe("dog");
	});

	test("decode empty list", () => {
		const input = hexToBytes("0xc0");
		const result = decode(input) as RlpDecoded[];
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(0);
	});

	test("decode nested list", () => {
		const input = hexToBytes("0xc7c0c1c0c3c0c1c0");
		const result = decode(input) as RlpDecoded[];
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(3);
		expect(Array.isArray(result[0])).toBe(true);
		expect((result[0] as RlpDecoded[]).length).toBe(0);
	});

	test("decode integer 0", () => {
		const input = hexToBytes("0x80");
		const result = decode(input) as Uint8Array;
		expect(result.length).toBe(0);
	});

	test("decode integer 1", () => {
		const input = hexToBytes("0x01");
		const result = decode(input) as Uint8Array;
		expect(compareBytes(result, new Uint8Array([0x01]))).toBe(true);
	});

	test("decode integer 1024", () => {
		const input = hexToBytes("0x820400");
		const result = decode(input) as Uint8Array;
		expect(compareBytes(result, new Uint8Array([0x04, 0x00]))).toBe(true);
	});
});

describe("RLP Error Handling", () => {
	test("decode - input too short", () => {
		const input = hexToBytes("0x83646f"); // Says 3 bytes but only provides 2
		expect(() => decode(input)).toThrow(InputTooShort);
	});

	test("decode - leading zeros in length", () => {
		const input = hexToBytes("0xb8006161"); // Length encoded with leading zero
		expect(() => decode(input)).toThrow(LeadingZeros);
	});

	test("decode - non-canonical size", () => {
		const input = hexToBytes("0x8161"); // Single byte encoded as short string
		expect(() => decode(input)).toThrow(NonCanonicalSize);
	});

	test("encode - roundtrip consistency", () => {
		const original = [
			new TextEncoder().encode("hello"),
			new TextEncoder().encode("world"),
			[new Uint8Array([0x01, 0x02, 0x03])],
		];
		const encoded = encodeList(original);
		const decoded = decode(encoded);

		expect(Array.isArray(decoded)).toBe(true);
		const decodedList = decoded as RlpDecoded[];
		expect(decodedList.length).toBe(3);
	});
});

describe("RLP Edge Cases", () => {
	test("encode very large integer", () => {
		const largeNum = BigInt("0xffffffffffffffff");
		const result = encodeUint(largeNum);
		expect(result.length).toBeGreaterThan(0);
	});

	test("encode string with max single-byte length", () => {
		const input = new Uint8Array(55).fill(0x41);
		const result = encode(input);
		expect(result[0]).toBe(0xb7); // 0x80 + 55
	});

	test("encode string requiring length-of-length", () => {
		const input = new Uint8Array(56).fill(0x41);
		const result = encode(input);
		expect(result[0]).toBe(0xb8); // 0xb7 + 1 (length byte count)
		expect(result[1]).toBe(56); // actual length
	});

	test("deeply nested lists", () => {
		const nested: RlpDecoded = [[[[[new Uint8Array([0x01])]]]]];
		const result = encodeList(nested as RlpDecoded[]);
		const decoded = decode(result);
		expect(Array.isArray(decoded)).toBe(true);
	});
});

describe("RLP Utility Functions", () => {
	test("toHex - encode and convert to hex string", () => {
		const input = new TextEncoder().encode("dog");
		const hex = toHex(input);
		expect(hex).toBe("0x83646f67");
	});

	test("fromHex - decode from hex string", () => {
		const hex = "0x83646f67";
		const decoded = fromHex(hex);
		expect(decoded).toBeInstanceOf(Uint8Array);
		const text = new TextDecoder().decode(decoded as Uint8Array);
		expect(text).toBe("dog");
	});

	test("fromHex - works without 0x prefix", () => {
		const hex = "83646f67";
		const decoded = fromHex(hex);
		expect(decoded).toBeInstanceOf(Uint8Array);
		const text = new TextDecoder().decode(decoded as Uint8Array);
		expect(text).toBe("dog");
	});

	test("getLength - calculate encoded length", () => {
		const input = new TextEncoder().encode("dog");
		const length = getLength(input);
		expect(length).toBe(4); // 0x83 + 3 bytes
	});

	test("getLength - empty string", () => {
		const input = new Uint8Array([]);
		const length = getLength(input);
		expect(length).toBe(1); // 0x80
	});

	test("getLength - list", () => {
		const input = [
			new TextEncoder().encode("cat"),
			new TextEncoder().encode("dog"),
		];
		const length = getLength(input);
		expect(length).toBe(9); // 0xc8 + 0x83 cat + 0x83 dog
	});

	test("isValid - valid RLP data", () => {
		const input = hexToBytes("0x83646f67");
		expect(isValid(input)).toBe(true);
	});

	test("isValid - invalid RLP data", () => {
		const input = hexToBytes("0x83646f"); // Says 3 bytes but only 2
		expect(isValid(input)).toBe(false);
	});

	test("isValid - empty data", () => {
		const input = new Uint8Array([]);
		expect(isValid(input)).toBe(false);
	});

	test("isValid - single byte", () => {
		const input = hexToBytes("0x00");
		expect(isValid(input)).toBe(true);
	});
});

describe("RLP Large Data Tests", () => {
	test("encode/decode array with 1000 items", () => {
		const items: Uint8Array[] = [];
		for (let i = 0; i < 1000; i++) {
			items.push(new Uint8Array([i % 256]));
		}

		const encoded = encodeList(items);
		const decoded = decode(encoded) as RlpDecoded[];

		expect(Array.isArray(decoded)).toBe(true);
		expect(decoded.length).toBe(1000);
	});

	test("encode/decode very long string (10KB)", () => {
		const longString = new Uint8Array(10 * 1024).fill(0x61);
		const encoded = encode(longString);
		const decoded = decode(encoded) as Uint8Array;

		expect(compareBytes(decoded, longString)).toBe(true);
	});

	test("deeply nested structure (20 levels)", () => {
		let nested: RlpDecoded = new Uint8Array([0x01]);
		for (let i = 0; i < 20; i++) {
			nested = [nested];
		}

		const encoded = encodeList(nested as RlpDecoded[]);
		const decoded = decode(encoded);

		expect(Array.isArray(decoded)).toBe(true);
	});
});

describe("RLP Boundary Tests", () => {
	test("string at 55 byte boundary", () => {
		const input = new Uint8Array(55).fill(0x61);
		const encoded = encode(input);
		expect(encoded[0]).toBe(0xb7); // Short string max
		const decoded = decode(encoded) as Uint8Array;
		expect(compareBytes(decoded, input)).toBe(true);
	});

	test("string at 56 byte boundary", () => {
		const input = new Uint8Array(56).fill(0x61);
		const encoded = encode(input);
		expect(encoded[0]).toBe(0xb8); // Long string min
		expect(encoded[1]).toBe(56);
		const decoded = decode(encoded) as Uint8Array;
		expect(compareBytes(decoded, input)).toBe(true);
	});

	test("list at 55 byte boundary", () => {
		// Create list with exactly 55 bytes of payload
		// Each item "a" encodes to 1 byte (< 0x80)
		const items: Uint8Array[] = [];
		for (let i = 0; i < 55; i++) {
			items.push(new Uint8Array([0x61]));
		}
		const encoded = encodeList(items);
		expect(encoded[0]).toBe(0xf7); // Short list max (0xc0 + 55)
	});

	test("list at 56 byte boundary", () => {
		// Create list with exactly 56 bytes of payload
		const items: Uint8Array[] = [];
		for (let i = 0; i < 56; i++) {
			items.push(new Uint8Array([0x61]));
		}
		const encoded = encodeList(items);
		expect(encoded[0]).toBe(0xf8); // Long list min (0xf7 + 1)
		expect(encoded[1]).toBe(56);
	});

	test("integer at byte boundaries", () => {
		// 0x7f = 127 (single byte < 0x80)
		const encoded127 = encodeUint(127);
		expect(bytesToHex(encoded127)).toBe("0x7f");

		// 0x80 = 128 (needs encoding)
		const encoded128 = encodeUint(128);
		expect(bytesToHex(encoded128)).toBe("0x8180");

		// 0xff = 255
		const encoded255 = encodeUint(255);
		expect(bytesToHex(encoded255)).toBe("0x81ff");

		// 0x100 = 256
		const encoded256 = encodeUint(256);
		expect(bytesToHex(encoded256)).toBe("0x820100");
	});
});

describe("RLP Ethereum Specific Tests", () => {
	test("encode transaction-like structure", () => {
		const tx = [
			1n, // nonce
			BigInt("20000000000"), // gasPrice
			21000n, // gasLimit
			new TextEncoder().encode("0x1234567890123456789012345678901234567890"), // to
			BigInt("1000000000000000000"), // value
			new Uint8Array([]), // data
		];

		const encoded = encodeList(
			tx.map((item) =>
				typeof item === "bigint" ? encodeUint(item) : encode(item),
			),
		);
		expect(encoded.length).toBeGreaterThan(0);

		const decoded = decode(encoded) as RlpDecoded[];
		expect(Array.isArray(decoded)).toBe(true);
		expect(decoded.length).toBe(6);
	});

	test("encode empty transaction fields", () => {
		const fields = [
			new Uint8Array([]), // empty data
			new Uint8Array([0x00]), // zero value
			encodeUint(0), // zero as uint
		];

		const encoded = encodeList(fields);
		const decoded = decode(encoded) as RlpDecoded[];

		expect(Array.isArray(decoded)).toBe(true);
		expect(decoded.length).toBe(3);
	});

	test("encode address (20 bytes)", () => {
		const address = new Uint8Array(20).fill(0xab);
		const encoded = encode(address);
		expect(encoded[0]).toBe(0x94); // 0x80 + 20
		expect(encoded.length).toBe(21);
	});

	test("encode hash (32 bytes)", () => {
		const hash = new Uint8Array(32).fill(0xcd);
		const encoded = encode(hash);
		expect(encoded[0]).toBe(0xa0); // 0x80 + 32
		expect(encoded.length).toBe(33);
	});
});

describe("RLP Round-Trip Tests", () => {
	test("round-trip: simple string", () => {
		const original = new TextEncoder().encode("hello world");
		const encoded = encode(original);
		const decoded = decode(encoded) as Uint8Array;
		expect(compareBytes(decoded, original)).toBe(true);
	});

	test("round-trip: integer zero", () => {
		const encoded = encodeUint(0);
		const decoded = decode(encoded) as Uint8Array;
		expect(decoded.length).toBe(0);
	});

	test("round-trip: large integer", () => {
		const original = BigInt("0x123456789abcdef");
		const encoded = encodeUint(original);
		const decoded = decode(encoded) as Uint8Array;

		// Convert back to bigint
		let result = 0n;
		for (let i = 0; i < decoded.length; i++) {
			result = (result << 8n) | BigInt(decoded[i]);
		}
		expect(result).toBe(original);
	});

	test("round-trip: nested list", () => {
		const original = [
			new TextEncoder().encode("a"),
			[new TextEncoder().encode("b"), new TextEncoder().encode("c")],
			new TextEncoder().encode("d"),
		];

		const encoded = encodeList(original);
		const decoded = decode(encoded) as RlpDecoded[];

		expect(Array.isArray(decoded)).toBe(true);
		expect(decoded.length).toBe(3);
		expect(Array.isArray(decoded[1])).toBe(true);
	});

	test("round-trip: empty structures", () => {
		const testCases = [
			new Uint8Array([]), // empty string
			[] as RlpDecoded[], // empty list
			[new Uint8Array([])], // list with empty string
			[[] as RlpDecoded[]], // list with empty list
		];

		for (const original of testCases) {
			const encoded = Array.isArray(original)
				? encodeList(original)
				: encode(original);
			const decoded = decode(encoded);
			// Just verify it decodes without error
			expect(decoded).toBeDefined();
		}
	});
});
