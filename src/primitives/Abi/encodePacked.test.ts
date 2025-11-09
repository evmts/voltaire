/**
 * Comprehensive tests for encodePacked
 * Tests compact encoding without padding
 */

import { describe, expect, it } from "vitest";
import { encodePacked } from "./encodePacked.js";
import * as Abi from "./index.js";
import { AbiParameterMismatchError } from "./Errors.js";
import type { Address } from "../Address/index.js";

// ============================================================================
// Basic Type Tests
// ============================================================================

describe("encodePacked - uint types", () => {
	it("encodes uint8", () => {
		const result = encodePacked(["uint8"], [42n]);
		expect(result).toMatch(/0x2a/i);
	});

	it("encodes uint8 zero", () => {
		const result = encodePacked(["uint8"], [0n]);
		expect(result).toMatch(/0x00/i);
	});

	it("encodes uint8 max (255)", () => {
		const result = encodePacked(["uint8"], [255n]);
		expect(result).toMatch(/0xff/i);
	});

	it("encodes uint16", () => {
		const result = encodePacked(["uint16"], [0x1234n]);
		expect(result).toMatch(/0x1234/i);
	});

	it("encodes uint32", () => {
		const result = encodePacked(["uint32"], [0x12345678n]);
		expect(result).toMatch(/0x12345678/i);
	});

	it("encodes uint64", () => {
		const result = encodePacked(["uint64"], [0x123456789abcdef0n]);
		expect(result).toMatch(/0x123456789abcdef0/i);
	});

	it("encodes uint128", () => {
		const value = 0x123456789abcdef0123456789abcdef0n;
		const result = encodePacked(["uint128"], [value]);
		expect(result).toMatch(/0x123456789abcdef0123456789abcdef0/i);
	});

	it("encodes uint256", () => {
		const value =
			0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0n;
		const result = encodePacked(["uint256"], [value]);
		expect(result).toMatch(
			/0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0/i,
		);
	});

	it("encodes multiple uint values without padding", () => {
		// uint8 (1 byte) + uint16 (2 bytes) + uint32 (4 bytes) = 7 bytes total
		const result = encodePacked(
			["uint8", "uint16", "uint32"],
			[0x12n, 0x3456n, 0x789abcden],
		);
		expect(result).toMatch(/0x12[34]{4}789abcde/i);
	});
});

describe("encodePacked - int types", () => {
	it("encodes int8 positive", () => {
		const result = encodePacked(["int8"], [42n]);
		expect(result).toMatch(/0x2a/i);
	});

	it("encodes int8 negative (-1)", () => {
		const result = encodePacked(["int8"], [-1n]);
		expect(result).toMatch(/0xff/i); // Two's complement
	});

	it("encodes int8 negative (-128)", () => {
		const result = encodePacked(["int8"], [-128n]);
		expect(result).toMatch(/0x80/i);
	});

	it("encodes int16 positive", () => {
		const result = encodePacked(["int16"], [1000n]);
		expect(result).toMatch(/0x03e8/i);
	});

	it("encodes int16 negative", () => {
		const result = encodePacked(["int16"], [-1n]);
		expect(result).toMatch(/0xffff/i); // Two's complement
	});

	it("encodes int32 positive", () => {
		const result = encodePacked(["int32"], [123456789n]);
		expect(result).toMatch(/0x075bcd15/i);
	});

	it("encodes int32 negative", () => {
		const result = encodePacked(["int32"], [-1n]);
		expect(result).toMatch(/0xffffffff/i);
	});

	it("encodes int256", () => {
		const result = encodePacked(["int256"], [12345n]);
		expect(result).toContain("3039"); // 0x3039 in hex
	});

	it("encodes int256 negative", () => {
		const result = encodePacked(["int256"], [-1n]);
		// Should be all 0xff bytes (32 bytes = 64 hex chars)
		expect(result).toMatch(/0xf{64}/i);
	});
});

describe("encodePacked - address type", () => {
	it("encodes address without padding", () => {
		const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const result = encodePacked(["address"], [addr]);
		// Address should be exactly 20 bytes (40 hex chars) with no padding
		expect(result.toLowerCase()).toBe(`0x${addr.slice(2).toLowerCase()}`);
	});

	it("encodes zero address", () => {
		const addr = "0x0000000000000000000000000000000000000000" as Address;
		const result = encodePacked(["address"], [addr]);
		expect(result).toMatch(/0x0{40}/i);
	});

	it("encodes multiple addresses consecutively", () => {
		const addr1 = "0x0000000000000000000000000000000000000001" as Address;
		const addr2 = "0x0000000000000000000000000000000000000002" as Address;
		const result = encodePacked(["address", "address"], [addr1, addr2]);
		// 40 bytes total (20 + 20), no padding between
		expect(result.length).toBe(2 + 40 * 2); // "0x" + 80 hex chars
	});
});

describe("encodePacked - bool type", () => {
	it("encodes true as single byte", () => {
		const result = encodePacked(["bool"], [true]);
		expect(result).toMatch(/0x01/i);
	});

	it("encodes false as single byte", () => {
		const result = encodePacked(["bool"], [false]);
		expect(result).toMatch(/0x00/i);
	});

	it("encodes multiple bools", () => {
		const result = encodePacked(
			["bool", "bool", "bool"],
			[true, false, true],
		);
		expect(result).toMatch(/0x010001/i);
	});
});

describe("encodePacked - fixed bytes types", () => {
	it("encodes bytes1 without padding", () => {
		const result = encodePacked(["bytes1"], ["0x42"]);
		expect(result).toMatch(/0x42/i);
	});

	it("encodes bytes4 without padding", () => {
		const result = encodePacked(["bytes4"], ["0x12345678"]);
		expect(result).toMatch(/0x12345678/i);
	});

	it("encodes bytes8", () => {
		const result = encodePacked(["bytes8"], ["0x123456789abcdef0"]);
		expect(result).toMatch(/0x123456789abcdef0/i);
	});

	it("encodes bytes32", () => {
		const value = "0x" + "ff".repeat(32);
		const result = encodePacked(["bytes32"], [value]);
		expect(result).toMatch(/0xf{64}/i);
	});

	it("encodes multiple fixed bytes consecutively", () => {
		const result = encodePacked(
			["bytes1", "bytes2", "bytes4"],
			["0x12", "0x3456", "0x789abcde"],
		);
		expect(result).toMatch(/0x123456789abcde/i);
	});
});

describe("encodePacked - dynamic bytes", () => {
	it("encodes empty bytes", () => {
		const result = encodePacked(["bytes"], ["0x"]);
		expect(result).toMatch(/0x/i);
	});

	it("encodes bytes without length prefix", () => {
		const result = encodePacked(["bytes"], ["0x123456"]);
		expect(result).toMatch(/0x123456/i);
	});

	it("encodes long bytes without padding", () => {
		const data = "0x" + "ab".repeat(50);
		const result = encodePacked(["bytes"], [data]);
		expect(result.toLowerCase()).toBe(data.toLowerCase());
	});

	it("encodes multiple bytes concatenated", () => {
		const result = encodePacked(["bytes", "bytes"], ["0x1234", "0x5678"]);
		expect(result).toMatch(/0x12345678/i);
	});
});

describe("encodePacked - string type", () => {
	it("encodes empty string", () => {
		const result = encodePacked(["string"], [""]);
		expect(result).toMatch(/0x/i);
	});

	it("encodes string as UTF-8 bytes without length", () => {
		const result = encodePacked(["string"], ["hello"]);
		// "hello" = 0x68656c6c6f in UTF-8
		expect(result).toMatch(/0x68656c6c6f/i);
	});

	it("encodes longer string", () => {
		const str = "The quick brown fox";
		const result = encodePacked(["string"], [str]);
		const utf8Bytes = new TextEncoder().encode(str);
		// Result should be hex of UTF-8 bytes
		expect(result.length).toBe(2 + utf8Bytes.length * 2); // "0x" + hex
	});

	it("encodes UTF-8 string with emoji", () => {
		const result = encodePacked(["string"], ["hello 🌍"]);
		const utf8Bytes = new TextEncoder().encode("hello 🌍");
		expect(result.length).toBe(2 + utf8Bytes.length * 2);
	});

	it("encodes multiple strings concatenated", () => {
		const result = encodePacked(["string", "string"], ["hello", "world"]);
		expect(result).toMatch(/0x68656c6c6f776f726c64/i); // "helloworld" in hex
	});
});

describe("encodePacked - arrays", () => {
	it("encodes empty array", () => {
		const result = encodePacked(["uint256[]"], [[]]);
		expect(result).toMatch(/0x/i);
	});

	it("encodes uint256[] without length prefix", () => {
		const result = encodePacked(["uint256[]"], [[1n, 2n, 3n]]);
		// Each uint256 is 32 bytes, no padding, no length
		expect(result.length).toBe(2 + 32 * 3 * 2); // "0x" + 96 bytes * 2 hex chars
	});

	it("encodes uint8[] compactly", () => {
		const result = encodePacked(["uint8[]"], [[0x12n, 0x34n, 0x56n]]);
		expect(result).toMatch(/0x123456/i);
	});

	it("encodes address[] compactly", () => {
		const addrs = [
			"0x0000000000000000000000000000000000000001",
			"0x0000000000000000000000000000000000000002",
		] as Address[];
		const result = encodePacked(["address[]"], [addrs]);
		// 40 bytes total, no length prefix
		expect(result.length).toBe(2 + 40 * 2);
	});

	it("encodes bool[] compactly", () => {
		const result = encodePacked(["bool[]"], [[true, false, true]]);
		expect(result).toMatch(/0x010001/i);
	});
});

describe("encodePacked - fixed arrays", () => {
	it("encodes uint256[3]", () => {
		const result = encodePacked(["uint256[3]"], [[1n, 2n, 3n]]);
		expect(result.length).toBe(2 + 32 * 3 * 2); // "0x" + 96 bytes
	});

	it("encodes uint8[4]", () => {
		const result = encodePacked(
			["uint8[4]"],
			[[0x12n, 0x34n, 0x56n, 0x78n]],
		);
		expect(result).toMatch(/0x12345678/i);
	});

	it("encodes address[2]", () => {
		const addrs = [
			"0x0000000000000000000000000000000000000001",
			"0x0000000000000000000000000000000000000002",
		] as Address[];
		const result = encodePacked(["address[2]"], [addrs]);
		expect(result.length).toBe(2 + 40 * 2);
	});
});

// ============================================================================
// Mixed Type Tests
// ============================================================================

describe("encodePacked - mixed types", () => {
	it("encodes address + uint256 compactly", () => {
		const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const amount = 1000n;
		const result = encodePacked(["address", "uint256"], [addr, amount]);
		// 20 bytes (address) + 32 bytes (uint256) = 52 bytes = 104 hex chars
		expect(result.length).toBe(2 + 52 * 2);
	});

	it("encodes uint8 + address + bool", () => {
		const result = encodePacked(
			["uint8", "address", "bool"],
			[42n, "0x0000000000000000000000000000000000000001", true],
		);
		// 1 + 20 + 1 = 22 bytes = 44 hex chars
		expect(result.length).toBe(2 + 22 * 2);
	});

	it("encodes string + uint256", () => {
		const result = encodePacked(["string", "uint256"], ["hello", 42n]);
		// 5 bytes (UTF-8 "hello") + 32 bytes (uint256) = 37 bytes
		expect(result.length).toBe(2 + 37 * 2);
	});

	it("encodes bytes + address + uint8", () => {
		const result = encodePacked(
			["bytes", "address", "uint8"],
			["0x1234", "0x0000000000000000000000000000000000000001", 0xffn],
		);
		// 2 + 20 + 1 = 23 bytes
		expect(result.length).toBe(2 + 23 * 2);
	});
});

// ============================================================================
// Real-World Use Cases
// ============================================================================

describe("encodePacked - real-world use cases", () => {
	it("encodes signature message (address + nonce)", () => {
		const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const nonce = 42n;
		const result = encodePacked(["address", "uint256"], [addr, nonce]);
		expect(result.length).toBe(2 + 52 * 2);
	});

	it("encodes permit message components", () => {
		const owner = "0x0000000000000000000000000000000000000001" as Address;
		const spender = "0x0000000000000000000000000000000000000002" as Address;
		const value = 1000000000000000000n;
		const result = encodePacked(
			["address", "address", "uint256"],
			[owner, spender, value],
		);
		// 20 + 20 + 32 = 72 bytes
		expect(result.length).toBe(2 + 72 * 2);
	});

	it("encodes token ID creation (address + uint256)", () => {
		const creator = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const index = 1n;
		const result = encodePacked(["address", "uint256"], [creator, index]);
		expect(result).toBeInstanceOf(String);
		expect(result.startsWith("0x")).toBe(true);
	});

	it("encodes CREATE2 address components", () => {
		// For CREATE2: keccak256(0xff ++ address ++ salt ++ keccak256(bytecode))
		const prefix = 0xffn;
		const deployer = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const salt =
			0x0000000000000000000000000000000000000000000000000000000000000001n;
		const bytecodeHash = "0x" + "aa".repeat(32); // keccak256 of bytecode
		const result = encodePacked(
			["uint8", "address", "uint256", "bytes32"],
			[prefix, deployer, salt, bytecodeHash],
		);
		// 1 + 20 + 32 + 32 = 85 bytes
		expect(result.length).toBe(2 + 85 * 2);
	});

	it("encodes EIP-712 domain separator components", () => {
		const name = "MyToken";
		const version = "1";
		const chainId = 1n;
		const verifyingContract =
			"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const result = encodePacked(
			["string", "string", "uint256", "address"],
			[name, version, chainId, verifyingContract],
		);
		expect(result).toBeInstanceOf(String);
	});
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe("encodePacked - error handling", () => {
	it("throws on type/value count mismatch", () => {
		expect(() => encodePacked(["uint256", "address"], [42n])).toThrow(
			AbiParameterMismatchError,
		);
	});

	it("throws on too many values", () => {
		expect(() => encodePacked(["uint256"], [42n, 100n] as any)).toThrow(
			AbiParameterMismatchError,
		);
	});

	it("throws on invalid bytes length", () => {
		expect(
			() => encodePacked(["bytes4"], ["0x12"]), // Too short
		).toThrow();
	});

	it("throws on fixed array length mismatch", () => {
		expect(
			() => encodePacked(["uint256[3]"], [[1n, 2n]]), // Only 2 elements
		).toThrow();
	});

	it("handles unsupported type gracefully", () => {
		expect(() => encodePacked(["invalid_type" as any], [42n])).toThrow();
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("encodePacked - edge cases", () => {
	it("encodes empty parameter list", () => {
		const result = encodePacked([], []);
		expect(result).toMatch(/0x/i);
	});

	it("encodes zero values", () => {
		const result = encodePacked(
			["uint8", "uint16", "uint32", "uint256"],
			[0n, 0n, 0n, 0n],
		);
		// 1 + 2 + 4 + 32 = 39 bytes of zeros
		expect(result).toMatch(/0x0{78}/i); // 39 * 2 = 78 hex chars
	});

	it("encodes max uint values", () => {
		const result = encodePacked(["uint8", "uint16"], [255n, 65535n]);
		expect(result).toMatch(/0xffffff/i);
	});

	it("encodes all negative int values", () => {
		const result = encodePacked(["int8", "int16"], [-1n, -1n]);
		expect(result).toMatch(/0xffffff/i); // All 0xff
	});

	it("encodes nested arrays", () => {
		const result = encodePacked(
			["uint8[][]"],
			[
				[
					[1n, 2n],
					[3n, 4n],
				],
			],
		);
		expect(result).toBeInstanceOf(String);
	});

	it("encodes very long array", () => {
		const arr = Array.from({ length: 1000 }, (_, i) => BigInt(i % 256));
		const result = encodePacked(["uint8[]"], [arr]);
		expect(result.length).toBe(2 + 1000 * 2); // "0x" + 1000 bytes
	});
});

// ============================================================================
// Comparison with Standard Encoding
// ============================================================================

describe("encodePacked vs standard encoding", () => {
	it("packed is more compact than standard for uint8", () => {
		const packed = encodePacked(["uint8"], [42n]);
		const standard = Abi.encodeParameters([{ type: "uint8" }], [42n] as any);

		// Packed: 1 byte = 2 hex chars + "0x" = 4 chars
		expect(packed.length).toBe(4);
		// Standard: 32 bytes = 64 hex chars + "0x" = 66 chars
		expect(standard.length).toBe(32);
	});

	it("packed is more compact for multiple small values", () => {
		const types = ["uint8", "uint8", "uint8"];
		const values = [1n, 2n, 3n];

		const packed = encodePacked(types, values);
		const standard = Abi.encodeParameters(
			types.map((t) => ({ type: t })),
			values as any,
		);

		// Packed: 3 bytes
		expect(packed.length).toBe(2 + 3 * 2);
		// Standard: 96 bytes (3 * 32)
		expect(standard.length).toBe(96);
	});

	it("packed and standard same for uint256", () => {
		const value =
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
		const packed = encodePacked(["uint256"], [value]);
		const standard = Abi.encodeParameters([{ type: "uint256" }], [
			value,
		] as any);

		// Both should be 32 bytes
		expect(packed.length).toBe(standard.length);
	});
});
