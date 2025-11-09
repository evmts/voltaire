import { describe, expect, it } from "vitest";
import { hash } from "./hash.js";
import { hashHex } from "./hashHex.js";

describe("Keccak256.hashHex", () => {
	describe("basic functionality", () => {
		it("should hash hex string with 0x prefix", () => {
			const result = hashHex("0x1234");
			expect(result.length).toBe(32);
			expect(result).toBeInstanceOf(Uint8Array);
		});

		it("should hash hex string without 0x prefix", () => {
			const result = hashHex("1234");
			expect(result.length).toBe(32);
		});

		it("should produce same hash with or without 0x prefix", () => {
			const hash1 = hashHex("0x1234abcd");
			const hash2 = hashHex("1234abcd");

			expect(hash1).toEqual(hash2);
		});

		it("should hash empty hex string", () => {
			const result = hashHex("0x");
			const expected = hash(new Uint8Array(0));

			expect(result).toEqual(expected);
		});
	});

	describe("hex parsing", () => {
		it("should parse lowercase hex", () => {
			const result = hashHex("0xabcdef");

			const bytes = new Uint8Array([0xab, 0xcd, 0xef]);
			const expected = hash(bytes);

			expect(result).toEqual(expected);
		});

		it("should parse uppercase hex", () => {
			const result = hashHex("0xABCDEF");

			const bytes = new Uint8Array([0xab, 0xcd, 0xef]);
			const expected = hash(bytes);

			expect(result).toEqual(expected);
		});

		it("should parse mixed case hex", () => {
			const result = hashHex("0xAbCdEf");

			const bytes = new Uint8Array([0xab, 0xcd, 0xef]);
			const expected = hash(bytes);

			expect(result).toEqual(expected);
		});

		it("should parse single hex byte", () => {
			const result = hashHex("0x42");

			const bytes = new Uint8Array([0x42]);
			const expected = hash(bytes);

			expect(result).toEqual(expected);
		});

		it("should parse multiple bytes", () => {
			const result = hashHex("0x010203040506");

			const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
			const expected = hash(bytes);

			expect(result).toEqual(expected);
		});
	});

	describe("validation errors", () => {
		it("should throw for odd length hex string", () => {
			expect(() => hashHex("0x123")).toThrow("even length");
		});

		it("should throw for odd length without prefix", () => {
			expect(() => hashHex("123")).toThrow("even length");
		});

		it("should throw for invalid hex characters", () => {
			expect(() => hashHex("0x12gh")).toThrow("Invalid hex");
		});

		it("should throw for non-hex characters", () => {
			expect(() => hashHex("0x12 34")).toThrow("Invalid hex");
		});

		it("should throw for special characters", () => {
			expect(() => hashHex("0x12!@")).toThrow("Invalid hex");
		});
	});

	describe("various hex lengths", () => {
		it("should hash 2-character hex (1 byte)", () => {
			const result = hashHex("0xff");
			expect(result.length).toBe(32);
		});

		it("should hash 64-character hex (32 bytes)", () => {
			const hex = `0x${"ab".repeat(32)}`;
			const result = hashHex(hex);
			expect(result.length).toBe(32);
		});

		it("should hash 128-character hex (64 bytes)", () => {
			const hex = `0x${"cd".repeat(64)}`;
			const result = hashHex(hex);
			expect(result.length).toBe(32);
		});

		it("should hash long hex string", () => {
			const hex = `0x${"12".repeat(500)}`;
			const result = hashHex(hex);
			expect(result.length).toBe(32);
		});
	});

	describe("Ethereum address hashing", () => {
		it("should hash Ethereum address", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const result = hashHex(address);
			expect(result.length).toBe(32);
		});

		it("should be case-insensitive for addresses", () => {
			const address1 = "0xabcdef1234567890abcdef1234567890abcdef12";
			const address2 = "0xABCDEF1234567890ABCDEF1234567890ABCDEF12";

			const hash1 = hashHex(address1);
			const hash2 = hashHex(address2);

			expect(hash1).toEqual(hash2);
		});
	});

	describe("determinism", () => {
		it("should produce same hash for same hex", () => {
			const hex = "0x123456789abcdef0";

			const hash1 = hashHex(hex);
			const hash2 = hashHex(hex);

			expect(hash1).toEqual(hash2);
		});

		it("should produce different hashes for different hex", () => {
			const hash1 = hashHex("0x1234");
			const hash2 = hashHex("0x1235");

			expect(hash1).not.toEqual(hash2);
		});
	});

	describe("edge cases", () => {
		it("should hash all-zero bytes", () => {
			const hex = `0x${"00".repeat(32)}`;
			const result = hashHex(hex);

			const expected = hash(new Uint8Array(32));
			expect(result).toEqual(expected);
		});

		it("should hash all-ff bytes", () => {
			const hex = `0x${"ff".repeat(32)}`;
			const result = hashHex(hex);

			const expected = hash(new Uint8Array(32).fill(0xff));
			expect(result).toEqual(expected);
		});

		it("should hash sequential bytes", () => {
			let hex = "0x";
			for (let i = 0; i < 256; i++) {
				hex += i.toString(16).padStart(2, "0");
			}

			const result = hashHex(hex);
			expect(result.length).toBe(32);
		});
	});

	describe("cross-validation with hash()", () => {
		it("should match hash() for equivalent bytes", () => {
			const testCases = [
				{ hex: "0x00", bytes: new Uint8Array([0x00]) },
				{ hex: "0xff", bytes: new Uint8Array([0xff]) },
				{ hex: "0x1234", bytes: new Uint8Array([0x12, 0x34]) },
				{
					hex: "0xabcdef",
					bytes: new Uint8Array([0xab, 0xcd, 0xef]),
				},
			];

			for (const { hex: hexStr, bytes } of testCases) {
				const hexHash = hashHex(hexStr);
				const bytesHash = hash(bytes);

				expect(hexHash).toEqual(bytesHash);
			}
		});
	});

	describe("transaction data hashing", () => {
		it("should hash empty calldata", () => {
			const result = hashHex("0x");
			expect(result.length).toBe(32);
		});

		it("should hash function selector", () => {
			// transfer(address,uint256) selector
			const result = hashHex("0xa9059cbb");
			expect(result.length).toBe(32);
		});

		it("should hash full transaction data", () => {
			// Example function call data
			const data =
				"0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb00000000000000000000000000000000000000000000000000de0b6b3a7640000";
			const result = hashHex(data);
			expect(result.length).toBe(32);
		});
	});

	describe("CREATE2 salt hashing", () => {
		it("should hash 32-byte salt", () => {
			const salt = `0x${"42".repeat(32)}`;
			const result = hashHex(salt);
			expect(result.length).toBe(32);
		});
	});

	describe("bytecode hashing", () => {
		it("should hash contract bytecode", () => {
			// Example bytecode snippet
			const bytecode =
				"0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea26469706673582212";
			const result = hashHex(bytecode);
			expect(result.length).toBe(32);
		});
	});

	describe("special hex patterns", () => {
		it("should handle leading zeros", () => {
			const result = hashHex("0x0001");

			const expected = hash(new Uint8Array([0x00, 0x01]));
			expect(result).toEqual(expected);
		});

		it("should handle alternating pattern", () => {
			const hex = `0x${"a5".repeat(50)}`;
			const result = hashHex(hex);
			expect(result.length).toBe(32);
		});

		it("should handle descending pattern", () => {
			let hex = "0x";
			for (let i = 255; i >= 0; i--) {
				hex += i.toString(16).padStart(2, "0");
			}

			const result = hashHex(hex);
			expect(result.length).toBe(32);
		});
	});
});
