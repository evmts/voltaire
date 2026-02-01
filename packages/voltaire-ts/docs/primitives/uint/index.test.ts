/**
 * Tests for docs/primitives/uint/index.mdx code examples
 *
 * These tests verify that all code examples in the documentation work correctly.
 */
import { describe, expect, it } from "vitest";

describe("Uint (Uint256) Documentation Examples", () => {
	describe("Constants", () => {
		it("exports constants", async () => {
			const Uint = await import("../../../src/primitives/Uint/index.js");

			// Uint.MIN;   // 0n
			expect(Uint.MIN).toBe(0n);

			// Uint.MAX;   // 2^256 - 1
			expect(Uint.MAX).toBe((1n << 256n) - 1n);

			// Uint.ZERO;  // 0n
			expect(Uint.ZERO).toBe(0n);

			// Uint.ONE;   // 1n
			expect(Uint.ONE).toBe(1n);

			// Uint.SIZE;  // 32 (bytes)
			expect(Uint.SIZE).toBe(32);
		});
	});

	describe("Construction", () => {
		describe("from", () => {
			it("creates from bigint, number, or string", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const a = Uint.from(100n);
				const a = Uint.from(100n);
				expect(a).toBe(100n);

				// const b = Uint.from(255);
				const b = Uint.from(255);
				expect(b).toBe(255n);

				// const c = Uint.from("0xff");
				const c = Uint.from("0xff");
				expect(c).toBe(255n);

				// const d = Uint.from("12345");
				const d = Uint.from("12345");
				expect(d).toBe(12345n);
			});
		});

		describe("fromBigInt", () => {
			it("creates from bigint", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const value = Uint.fromBigInt(1000000000000000000n);  // 1 ETH in wei
				const value = Uint.fromBigInt(1000000000000000000n);
				expect(value).toBe(1000000000000000000n);
			});
		});

		describe("fromNumber", () => {
			it("creates from number", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const value = Uint.fromNumber(21000);  // Gas limit
				const value = Uint.fromNumber(21000);
				expect(value).toBe(21000n);
			});
		});

		describe("fromHex", () => {
			it("creates from hex string", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const value = Uint.fromHex("0xde0b6b3a7640000");  // 1 ETH in wei
				const value = Uint.fromHex("0xde0b6b3a7640000");
				expect(value).toBe(1000000000000000000n);
			});
		});

		describe("fromBytes", () => {
			it("creates from Uint8Array (big-endian)", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const bytes = new Uint8Array([0x01, 0x00]);  // 256 in big-endian
				// const value = Uint.fromBytes(bytes);
				const bytes = new Uint8Array([0x01, 0x00]);
				const value = Uint.fromBytes(bytes);
				expect(value).toBe(256n);
			});
		});

		describe("fromAbiEncoded", () => {
			it("creates from 32-byte ABI-encoded data", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const encoded = new Uint8Array(32);
				// encoded[31] = 0x64;  // 100
				// const value = Uint.fromAbiEncoded(encoded);
				const encoded = new Uint8Array(32);
				encoded[31] = 0x64;
				const value = Uint.fromAbiEncoded(encoded);
				expect(value).toBe(100n);
			});
		});

		describe("tryFrom", () => {
			it("returns value or undefined", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const valid = Uint.tryFrom(100n);    // Uint256Type
				const valid = Uint.tryFrom(100n);
				expect(valid).toBe(100n);

				// const invalid = Uint.tryFrom(-1n);   // undefined
				const invalid = Uint.tryFrom(-1n);
				expect(invalid).toBeUndefined();
			});
		});
	});

	describe("Conversion", () => {
		describe("toBigInt", () => {
			it("converts to bigint", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const bigint = Uint.toBigInt(Uint.from(100n));  // 100n
				const bigint = Uint.toBigInt(Uint.from(100n));
				expect(bigint).toBe(100n);
			});
		});

		describe("toNumber", () => {
			it("converts to number", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const num = Uint.toNumber(Uint.from(100n));  // 100
				const num = Uint.toNumber(Uint.from(100n));
				expect(num).toBe(100);
			});
		});

		describe("toHex", () => {
			it("converts to hex string", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const hex = Uint.toHex(Uint.from(255n));           // "0xff"
				// NOTE: API discrepancy - docs say unpadded by default, but actual API pads by default
				// Actual signature: toHex(uint, padded = true)
				const hex = Uint.toHex(Uint.from(255n), false);
				expect(hex).toBe("0xff");

				// const padded = Uint.toHex(Uint.from(255n), true);  // "0x00...00ff" (64 chars)
				const padded = Uint.toHex(Uint.from(255n), true);
				expect(padded).toBe(
					"0x00000000000000000000000000000000000000000000000000000000000000ff",
				);
				expect(padded.length).toBe(66); // 0x + 64 chars
			});
		});

		describe("toBytes", () => {
			it("converts to bytes", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const bytes = Uint.toBytes(Uint.from(256n));       // Minimal bytes
				// NOTE: API discrepancy - docs show optional size param, but actual API always returns 32 bytes
				const bytes = Uint.toBytes(Uint.from(256n));
				expect(bytes).toBeInstanceOf(Uint8Array);
				expect(bytes.length).toBe(32); // Always 32 bytes
				expect(bytes[30]).toBe(1);
				expect(bytes[31]).toBe(0);
			});
		});

		describe("toAbiEncoded", () => {
			it("converts to 32-byte ABI encoding", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const encoded = Uint.toAbiEncoded(Uint.from(100n));  // 32-byte Uint8Array
				const encoded = Uint.toAbiEncoded(Uint.from(100n));
				expect(encoded).toBeInstanceOf(Uint8Array);
				expect(encoded.length).toBe(32);
				expect(encoded[31]).toBe(100);
			});
		});

		describe("toString", () => {
			it("converts to string with optional radix", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const decimal = Uint.toString(Uint.from(255n));      // "255"
				const decimal = Uint.toString(Uint.from(255n));
				expect(decimal).toBe("255");

				// const hex = Uint.toString(Uint.from(255n), 16);      // "ff"
				const hex = Uint.toString(Uint.from(255n), 16);
				expect(hex).toBe("ff");

				// const binary = Uint.toString(Uint.from(255n), 2);    // "11111111"
				const binary = Uint.toString(Uint.from(255n), 2);
				expect(binary).toBe("11111111");
			});
		});
	});

	describe("Arithmetic", () => {
		describe("plus", () => {
			it("adds two values", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const sum = Uint.plus(Uint.from(100n), Uint.from(50n));  // 150n
				const sum = Uint.plus(Uint.from(100n), Uint.from(50n));
				expect(sum).toBe(150n);
			});
		});

		describe("minus", () => {
			it("subtracts two values", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const diff = Uint.minus(Uint.from(100n), Uint.from(50n));  // 50n
				const diff = Uint.minus(Uint.from(100n), Uint.from(50n));
				expect(diff).toBe(50n);
			});
		});

		describe("times", () => {
			it("multiplies two values", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const product = Uint.times(Uint.from(10n), Uint.from(5n));  // 50n
				const product = Uint.times(Uint.from(10n), Uint.from(5n));
				expect(product).toBe(50n);
			});
		});

		describe("dividedBy", () => {
			it("divides two values (integer division)", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const quotient = Uint.dividedBy(Uint.from(100n), Uint.from(7n));  // 14n
				const quotient = Uint.dividedBy(Uint.from(100n), Uint.from(7n));
				expect(quotient).toBe(14n);
			});
		});

		describe("modulo", () => {
			it("calculates remainder", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const remainder = Uint.modulo(Uint.from(100n), Uint.from(7n));  // 2n
				const remainder = Uint.modulo(Uint.from(100n), Uint.from(7n));
				expect(remainder).toBe(2n);
			});
		});

		describe("toPower", () => {
			it("raises to power", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const result = Uint.toPower(Uint.from(2n), Uint.from(10n));  // 1024n
				const result = Uint.toPower(Uint.from(2n), Uint.from(10n));
				expect(result).toBe(1024n);
			});
		});

		describe("sum (variadic)", () => {
			it("sums multiple values", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const total = Uint.sum(Uint.from(1n), Uint.from(2n), Uint.from(3n));  // 6n
				const total = Uint.sum(Uint.from(1n), Uint.from(2n), Uint.from(3n));
				expect(total).toBe(6n);
			});
		});

		describe("product (variadic)", () => {
			it("multiplies multiple values", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const result = Uint.product(Uint.from(2n), Uint.from(3n), Uint.from(4n));  // 24n
				const result = Uint.product(
					Uint.from(2n),
					Uint.from(3n),
					Uint.from(4n),
				);
				expect(result).toBe(24n);
			});
		});
	});

	describe("Comparison", () => {
		describe("equals / notEquals", () => {
			it("checks equality", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// Uint.equals(Uint.from(100n), Uint.from(100n));     // true
				expect(Uint.equals(Uint.from(100n), Uint.from(100n))).toBe(true);

				// Uint.notEquals(Uint.from(100n), Uint.from(50n));   // true
				expect(Uint.notEquals(Uint.from(100n), Uint.from(50n))).toBe(true);
			});
		});

		describe("lessThan / lessThanOrEqual", () => {
			it("checks less than comparisons", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// Uint.lessThan(Uint.from(50n), Uint.from(100n));         // true
				expect(Uint.lessThan(Uint.from(50n), Uint.from(100n))).toBe(true);

				// Uint.lessThanOrEqual(Uint.from(100n), Uint.from(100n)); // true
				expect(Uint.lessThanOrEqual(Uint.from(100n), Uint.from(100n))).toBe(
					true,
				);
			});
		});

		describe("greaterThan / greaterThanOrEqual", () => {
			it("checks greater than comparisons", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// Uint.greaterThan(Uint.from(100n), Uint.from(50n));         // true
				expect(Uint.greaterThan(Uint.from(100n), Uint.from(50n))).toBe(true);

				// Uint.greaterThanOrEqual(Uint.from(100n), Uint.from(100n)); // true
				expect(Uint.greaterThanOrEqual(Uint.from(100n), Uint.from(100n))).toBe(
					true,
				);
			});
		});

		describe("isZero", () => {
			it("checks if value is zero", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// Uint.isZero(Uint.from(0n));   // true
				expect(Uint.isZero(Uint.from(0n))).toBe(true);

				// Uint.isZero(Uint.from(1n));   // false
				expect(Uint.isZero(Uint.from(1n))).toBe(false);
			});
		});

		describe("minimum / maximum", () => {
			it("returns min/max of two values", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const min = Uint.minimum(Uint.from(100n), Uint.from(50n));  // 50n
				const min = Uint.minimum(Uint.from(100n), Uint.from(50n));
				expect(min).toBe(50n);

				// const max = Uint.maximum(Uint.from(100n), Uint.from(50n));  // 100n
				const max = Uint.maximum(Uint.from(100n), Uint.from(50n));
				expect(max).toBe(100n);
			});
		});

		describe("min / max (variadic)", () => {
			it("returns min/max of multiple values", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const smallest = Uint.min(Uint.from(5n), Uint.from(2n), Uint.from(8n));  // 2n
				const smallest = Uint.min(Uint.from(5n), Uint.from(2n), Uint.from(8n));
				expect(smallest).toBe(2n);

				// const largest = Uint.max(Uint.from(5n), Uint.from(2n), Uint.from(8n));   // 8n
				const largest = Uint.max(Uint.from(5n), Uint.from(2n), Uint.from(8n));
				expect(largest).toBe(8n);
			});
		});
	});

	describe("Bitwise Operations", () => {
		describe("bitwiseAnd", () => {
			it("performs bitwise AND", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const result = Uint.bitwiseAnd(
				//   Uint.from(0b11110000n),
				//   Uint.from(0b11001100n)
				// );  // 0b11000000n = 192n
				const result = Uint.bitwiseAnd(
					Uint.from(0b11110000n),
					Uint.from(0b11001100n),
				);
				expect(result).toBe(0b11000000n);
				expect(result).toBe(192n);
			});
		});

		describe("bitwiseOr", () => {
			it("performs bitwise OR", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const result = Uint.bitwiseOr(
				//   Uint.from(0b11110000n),
				//   Uint.from(0b00001111n)
				// );  // 0b11111111n = 255n
				const result = Uint.bitwiseOr(
					Uint.from(0b11110000n),
					Uint.from(0b00001111n),
				);
				expect(result).toBe(0b11111111n);
				expect(result).toBe(255n);
			});
		});

		describe("bitwiseXor", () => {
			it("performs bitwise XOR", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const result = Uint.bitwiseXor(
				//   Uint.from(0b11110000n),
				//   Uint.from(0b11001100n)
				// );  // 0b00111100n = 60n
				const result = Uint.bitwiseXor(
					Uint.from(0b11110000n),
					Uint.from(0b11001100n),
				);
				expect(result).toBe(0b00111100n);
				expect(result).toBe(60n);
			});
		});

		describe("bitwiseNot", () => {
			it("performs bitwise NOT (256-bit)", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const result = Uint.bitwiseNot(Uint.from(0n));
				// MAX (all bits set)
				const result = Uint.bitwiseNot(Uint.from(0n));
				expect(result).toBe(Uint.MAX);
			});
		});

		describe("shiftLeft / shiftRight", () => {
			it("performs bit shifts", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const left = Uint.shiftLeft(Uint.from(1n), Uint.from(8n));   // 256n
				const left = Uint.shiftLeft(Uint.from(1n), Uint.from(8n));
				expect(left).toBe(256n);

				// const right = Uint.shiftRight(Uint.from(256n), Uint.from(4n)); // 16n
				const right = Uint.shiftRight(Uint.from(256n), Uint.from(4n));
				expect(right).toBe(16n);
			});
		});
	});

	describe("Bit Analysis", () => {
		describe("bitLength", () => {
			it("returns number of bits needed to represent value", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// Uint.bitLength(Uint.from(0n));    // 0
				expect(Uint.bitLength(Uint.from(0n))).toBe(0);

				// Uint.bitLength(Uint.from(1n));    // 1
				expect(Uint.bitLength(Uint.from(1n))).toBe(1);

				// Uint.bitLength(Uint.from(255n));  // 8
				expect(Uint.bitLength(Uint.from(255n))).toBe(8);

				// Uint.bitLength(Uint.from(256n));  // 9
				expect(Uint.bitLength(Uint.from(256n))).toBe(9);
			});
		});

		describe("leadingZeros", () => {
			it("counts leading zero bits", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// Uint.leadingZeros(Uint.from(1n));    // 255
				expect(Uint.leadingZeros(Uint.from(1n))).toBe(255);

				// Uint.leadingZeros(Uint.from(255n));  // 248
				expect(Uint.leadingZeros(Uint.from(255n))).toBe(248);
			});
		});

		describe("popCount", () => {
			it("counts set bits (population count)", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// Uint.popCount(Uint.from(0n));           // 0
				expect(Uint.popCount(Uint.from(0n))).toBe(0);

				// Uint.popCount(Uint.from(255n));         // 8
				expect(Uint.popCount(Uint.from(255n))).toBe(8);

				// Uint.popCount(Uint.from(0b10101010n));  // 4
				expect(Uint.popCount(Uint.from(0b10101010n))).toBe(4);
			});
		});

		describe("isPowerOf2", () => {
			it("checks if value is power of 2", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// Uint.isPowerOf2(Uint.from(1n));    // true
				expect(Uint.isPowerOf2(Uint.from(1n))).toBe(true);

				// Uint.isPowerOf2(Uint.from(256n));  // true
				expect(Uint.isPowerOf2(Uint.from(256n))).toBe(true);

				// Uint.isPowerOf2(Uint.from(255n));  // false
				expect(Uint.isPowerOf2(Uint.from(255n))).toBe(false);
			});
		});
	});

	describe("Number Theory", () => {
		describe("gcd", () => {
			it("calculates greatest common divisor", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const result = Uint.gcd(Uint.from(48n), Uint.from(18n));  // 6n
				const result = Uint.gcd(Uint.from(48n), Uint.from(18n));
				expect(result).toBe(6n);
			});
		});

		describe("lcm", () => {
			it("calculates least common multiple", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// const result = Uint.lcm(Uint.from(12n), Uint.from(18n));  // 36n
				const result = Uint.lcm(Uint.from(12n), Uint.from(18n));
				expect(result).toBe(36n);
			});
		});
	});

	describe("Validation", () => {
		describe("isValid", () => {
			it("validates values", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// Uint.isValid(100n);   // true
				expect(Uint.isValid(100n)).toBe(true);

				// Uint.isValid(0n);     // true
				expect(Uint.isValid(0n)).toBe(true);

				// Uint.isValid(-1n);    // false
				expect(Uint.isValid(-1n)).toBe(false);

				// Uint.isValid(2n ** 256n);  // false
				expect(Uint.isValid(2n ** 256n)).toBe(false);
			});
		});
	});

	describe("Use Case Examples", () => {
		describe("Token Balance Calculation", () => {
			it("formats token balance with 18 decimals", async () => {
				const Uint = await import("../../../src/primitives/Uint/index.js");

				// function formatTokenBalance(weiAmount: Uint.Uint256Type): string {
				//   const decimals = Uint.from(18n);
				//   const divisor = Uint.toPower(Uint.from(10n), decimals);
				//   const whole = Uint.dividedBy(weiAmount, divisor);
				//   const remainder = Uint.modulo(weiAmount, divisor);
				//   return `${Uint.toString(whole)}.${Uint.toString(remainder).padStart(18, '0')}`;
				// }
				function formatTokenBalance(weiAmount: bigint): string {
					const decimals = Uint.from(18n);
					const divisor = Uint.toPower(Uint.from(10n), decimals);
					const whole = Uint.dividedBy(weiAmount, divisor);
					const remainder = Uint.modulo(weiAmount, divisor);
					return `${Uint.toString(whole)}.${Uint.toString(remainder).padStart(18, "0")}`;
				}

				// const balance = Uint.from("1500000000000000000000");  // 1500 tokens
				// console.log(formatTokenBalance(balance));  // "1500.000000000000000000"
				const balance = Uint.from("1500000000000000000000");
				expect(formatTokenBalance(balance)).toBe("1500.000000000000000000");
			});
		});
	});
});
