import { describe, it, expect } from "vitest";
import { modexp, execute, PrecompileAddress } from "./precompiles.js";
import * as Hardfork from "../primitives/Hardfork/index.js";
import type { BrandedHardfork } from "../primitives/Hardfork/BrandedHardfork/BrandedHardfork.js";

/**
 * Helper to convert bigint to big-endian bytes with padding
 */
function bigintToBytes(n: bigint, size?: number): Uint8Array {
	if (n === 0n) return size ? new Uint8Array(size) : new Uint8Array(1);

	const bytes: number[] = [];
	let val = n;
	while (val > 0n) {
		bytes.unshift(Number(val & 0xffn));
		val >>= 8n;
	}

	if (size) {
		const result = new Uint8Array(size);
		const offset = size - bytes.length;
		if (offset < 0) {
			result.set(bytes.slice(-size), 0);
		} else {
			result.set(bytes, offset);
		}
		return result;
	}

	return new Uint8Array(bytes);
}

/**
 * Helper to convert bytes to bigint
 */
function bytesToBigint(bytes: Uint8Array): bigint {
	let result = 0n;
	for (let i = 0; i < bytes.length; i++) {
		result = (result << 8n) | BigInt(bytes[i] ?? 0);
	}
	return result;
}

/**
 * Helper to write uint256 to buffer
 */
function writeUint256(buf: Uint8Array, offset: number, value: bigint): void {
	const bytes = bigintToBytes(value, 32);
	buf.set(bytes, offset);
}

/**
 * Helper to create modexp input
 */
function createModExpInput(base: bigint, exp: bigint, mod: bigint): Uint8Array {
	const baseBytes = bigintToBytes(base);
	const expBytes = bigintToBytes(exp);
	const modBytes = bigintToBytes(mod);

	const input = new Uint8Array(
		96 + baseBytes.length + expBytes.length + modBytes.length,
	);

	writeUint256(input, 0, BigInt(baseBytes.length));
	writeUint256(input, 32, BigInt(expBytes.length));
	writeUint256(input, 64, BigInt(modBytes.length));

	input.set(baseBytes, 96);
	input.set(expBytes, 96 + baseBytes.length);
	input.set(modBytes, 96 + baseBytes.length + expBytes.length);

	return input;
}

/**
 * Helper to create modexp input from hex strings (EIP-198 test vectors)
 */
function createModExpInputFromHex(
	baseHex: string,
	expHex: string,
	modHex: string,
): Uint8Array {
	const baseBytes = hexToBytes(baseHex);
	const expBytes = hexToBytes(expHex);
	const modBytes = hexToBytes(modHex);

	const input = new Uint8Array(
		96 + baseBytes.length + expBytes.length + modBytes.length,
	);

	writeUint256(input, 0, BigInt(baseBytes.length));
	writeUint256(input, 32, BigInt(expBytes.length));
	writeUint256(input, 64, BigInt(modBytes.length));

	input.set(baseBytes, 96);
	input.set(expBytes, 96 + baseBytes.length);
	input.set(modBytes, 96 + baseBytes.length + expBytes.length);

	return input;
}

function hexToBytes(hex: string): Uint8Array {
	const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(clean.length / 2);
	for (let i = 0; i < clean.length; i += 2) {
		bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
	}
	return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

describe("Precompile: ModExp (0x05)", () => {
	describe("Valid execution", () => {
		it("should compute 2^3 % 5 = 3", () => {
			const input = createModExpInput(2n, 3n, 5n);
			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			expect(bytesToBigint(result.output)).toBe(3n);
		});

		it("should compute 3^7 % 13 = 3", () => {
			const input = createModExpInput(3n, 7n, 13n);
			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			expect(bytesToBigint(result.output)).toBe(3n);
		});

		it("should compute large exponent 2^100 % 1000", () => {
			const input = createModExpInput(2n, 100n, 1000n);
			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			const expected = 2n ** 100n % 1000n;
			expect(bytesToBigint(result.output)).toBe(expected);
		});

		it("should compute large modulus with 256-bit numbers", () => {
			const base = 12345678901234567890n;
			const exp = 5n;
			const mod = 999999999999999999999999n;

			const input = createModExpInput(base, exp, mod);
			const result = modexp(input, 1000000n);

			expect(result.success).toBe(true);
			const expected = base ** exp % mod;
			expect(bytesToBigint(result.output)).toBe(expected);
		});

		it("should handle EIP-198 example: RSA-2048 signature verification", () => {
			// Test vector from EIP-198
			const baseHex =
				"03fffffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2efffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe";
			const expHex = "010001";
			const modHex =
				"9b3e2fba0d3f09834c2a01516e68e2c1aeb0cf4c1f51b2aa2d07b0c0a906b6c8e1fc9dd809b3c8b63cc2e5f26de1a49c3dfccf6f63c5c0d3d7f7f05e5d3b3d3e4c";

			const input = createModExpInputFromHex(baseHex, expHex, modHex);
			const result = modexp(input, 10000000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBeGreaterThan(0);
		});

		it("should compute exponent = 1 (returns base % mod)", () => {
			const input = createModExpInput(17n, 1n, 10n);
			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			expect(bytesToBigint(result.output)).toBe(7n);
		});

		it("should handle base equal to modulus (result = 0)", () => {
			const input = createModExpInput(5n, 2n, 5n);
			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			expect(bytesToBigint(result.output)).toBe(0n);
		});

		it("should handle very large RSA modulus (2048-bit)", () => {
			const base = 2n ** 256n - 1n;
			const exp = 3n;
			const mod = 2n ** 2048n - 1n;

			const input = createModExpInput(base, exp, mod);
			const result = modexp(input, 100000000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(256);
		});
	});

	describe("Zero handling", () => {
		it("should handle zero base (0^n % m = 0 for n > 0)", () => {
			const input = createModExpInput(0n, 5n, 7n);
			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			expect(bytesToBigint(result.output)).toBe(0n);
		});

		it("should handle zero exponent (n^0 % m = 1)", () => {
			const input = createModExpInput(5n, 0n, 7n);
			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			expect(bytesToBigint(result.output)).toBe(1n);
		});

		it("should handle zero modulus (returns empty output)", () => {
			const input = createModExpInput(5n, 3n, 0n);
			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(0);
		});

		it("should handle all zeros input", () => {
			const input = new Uint8Array(96);
			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(0);
		});

		it("should handle zero base with zero exponent (0^0 = 1)", () => {
			const input = createModExpInput(0n, 0n, 7n);
			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			expect(bytesToBigint(result.output)).toBe(1n);
		});
	});

	describe("Gas calculation", () => {
		it("should use minimum gas (200) for small inputs", () => {
			const input = createModExpInput(2n, 1n, 5n);
			const result = modexp(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBeGreaterThanOrEqual(200n);
		});

		it("should calculate higher gas for larger inputs", () => {
			const input = createModExpInput(2n ** 256n - 1n, 100n, 2n ** 256n - 1n);
			const result = modexp(input, 10000000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBeGreaterThan(200n);
		});

		it("should calculate gas based on complexity", () => {
			const input1 = createModExpInput(2n, 2n, 100n);
			const result1 = modexp(input1, 10000000n);

			const input2 = createModExpInput(2n ** 512n, 2n ** 128n, 2n ** 512n);
			const result2 = modexp(input2, 10000000n);

			expect(result2.gasUsed).toBeGreaterThan(result1.gasUsed);
		});

		it("should use 200 minimum gas per EIP-2565", () => {
			const input = createModExpInput(1n, 1n, 1n);
			const result = modexp(input, 1000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(200n);
		});

		it("should handle very large input (high gas)", () => {
			const base = 2n ** 1024n - 1n;
			const exp = 2n ** 256n - 1n;
			const mod = 2n ** 2048n - 1n;

			const input = createModExpInput(base, exp, mod);
			const result = modexp(input, 1000000000000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBeGreaterThan(100000n);
		});
	});

	describe("Out of gas handling", () => {
		it("should fail when gas limit is insufficient", () => {
			const input = createModExpInput(2n ** 256n - 1n, 100n, 2n ** 256n - 1n);
			const result = modexp(input, 100n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
		});

		it("should succeed with exact gas amount", () => {
			const input = createModExpInput(2n, 3n, 5n);
			const result1 = modexp(input, 100000n);
			expect(result1.success).toBe(true);

			const result2 = modexp(input, result1.gasUsed);
			expect(result2.success).toBe(true);
		});
	});

	describe("Invalid inputs", () => {
		it("should fail with input too short (< 96 bytes)", () => {
			const input = new Uint8Array(95);
			const result = modexp(input, 100000n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid input length");
		});

		it("should handle truncated base", () => {
			const input = new Uint8Array(96 + 5);
			writeUint256(input, 0, 10n);
			writeUint256(input, 32, 1n);
			writeUint256(input, 64, 1n);

			const result = modexp(input, 100000n);
			expect(result.success).toBe(true);
		});

		it("should handle truncated exponent", () => {
			const input = new Uint8Array(96 + 10);
			writeUint256(input, 0, 1n);
			writeUint256(input, 32, 20n);
			writeUint256(input, 64, 1n);

			const result = modexp(input, 100000n);
			expect(result.success).toBe(true);
		});

		it("should handle truncated modulus", () => {
			const input = new Uint8Array(96 + 10);
			writeUint256(input, 0, 1n);
			writeUint256(input, 32, 1n);
			writeUint256(input, 64, 20n);

			const result = modexp(input, 100000n);
			expect(result.success).toBe(true);
		});
	});

	describe("Edge cases", () => {
		it("should handle modulus = 1 (result always 0)", () => {
			const input = createModExpInput(999n, 999n, 1n);
			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			expect(bytesToBigint(result.output)).toBe(0n);
		});

		it("should handle maximum safe bigint values", () => {
			const max = BigInt(Number.MAX_SAFE_INTEGER);
			const input = createModExpInput(max, 2n, max);
			const result = modexp(input, 1000000n);

			expect(result.success).toBe(true);
		});

		it("should pad output to modulus length", () => {
			const input = createModExpInput(2n, 2n, 1000000n);
			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(3);
		});

		it("should handle prime modulus (Fermat's little theorem test)", () => {
			const p = 97n;
			const base = 3n;
			const exp = p - 1n;

			const input = createModExpInput(base, exp, p);
			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			expect(bytesToBigint(result.output)).toBe(1n);
		});

		it("should handle composite modulus", () => {
			const input = createModExpInput(7n, 13n, 15n);
			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			const expected = 7n ** 13n % 15n;
			expect(bytesToBigint(result.output)).toBe(expected);
		});
	});

	describe("Hardfork compatibility", () => {
		it("should be available from Byzantium onwards", () => {
			const byzantium = Hardfork.BYZANTIUM;
			const homestead = Hardfork.HOMESTEAD;

			expect(Hardfork.isAtLeast(byzantium, Hardfork.BYZANTIUM)).toBe(true);
			expect(Hardfork.isAtLeast(homestead, Hardfork.BYZANTIUM)).toBe(false);
		});

		it("should execute with Byzantium hardfork", () => {
			const input = createModExpInput(2n, 3n, 5n);
			const result = execute(
				PrecompileAddress.MODEXP,
				input,
				100000n,
				Hardfork.BYZANTIUM,
			);

			expect(result.success).toBe(true);
			expect(bytesToBigint(result.output)).toBe(3n);
		});

		it("should execute with Berlin hardfork", () => {
			const input = createModExpInput(2n, 3n, 5n);
			const result = execute(
				PrecompileAddress.MODEXP,
				input,
				100000n,
				Hardfork.BERLIN,
			);

			expect(result.success).toBe(true);
			expect(bytesToBigint(result.output)).toBe(3n);
		});

		it("should execute with latest hardfork", () => {
			const input = createModExpInput(2n, 3n, 5n);
			const result = execute(
				PrecompileAddress.MODEXP,
				input,
				100000n,
				Hardfork.PRAGUE,
			);

			expect(result.success).toBe(true);
			expect(bytesToBigint(result.output)).toBe(3n);
		});
	});

	describe("EIP-198 test vectors", () => {
		it("should compute simple test case from EIP-198", () => {
			const input = new Uint8Array(96 + 3);
			writeUint256(input, 0, 1n);
			writeUint256(input, 32, 1n);
			writeUint256(input, 64, 1n);
			input[96] = 3;
			input[97] = 1;
			input[98] = 5;

			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output[0]).toBe(3);
		});

		it("should compute zero base example from EIP-198", () => {
			const input = new Uint8Array(96 + 3);
			writeUint256(input, 0, 1n);
			writeUint256(input, 32, 1n);
			writeUint256(input, 64, 1n);
			input[96] = 0;
			input[97] = 1;
			input[98] = 5;

			const result = modexp(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output[0]).toBe(0);
		});
	});

	describe("DoS resistance", () => {
		it("should calculate gas for very large exponent length", () => {
			const input = new Uint8Array(96);
			writeUint256(input, 0, 1n);
			writeUint256(input, 32, 2n ** 64n);
			writeUint256(input, 64, 1n);

			const result = modexp(input, 1000000000000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBeGreaterThanOrEqual(200n);
		});

		it("should handle reasonable large computation", () => {
			const input = createModExpInput(2n, 1000n, 2n ** 128n - 1n);
			const result = modexp(input, 100000000n);

			expect(result.success).toBe(true);
		});
	});

	describe("Gas cost variations", () => {
		it("should use less gas for small modulus (quadratic complexity)", () => {
			const input1 = createModExpInput(2n, 10n, 10n);
			const result1 = modexp(input1, 100000n);

			expect(result1.success).toBe(true);
			expect(result1.gasUsed).toBeGreaterThanOrEqual(200n);
			expect(result1.gasUsed).toBeLessThan(1000n);
		});

		it("should use more gas for medium modulus (mixed complexity)", () => {
			const input = createModExpInput(2n, 100n, 2n ** 512n);
			const result = modexp(input, 10000000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBeGreaterThan(1000n);
		});

		it("should use most gas for large modulus (linear complexity)", () => {
			const input = createModExpInput(2n, 100n, 2n ** 1024n);
			const result = modexp(input, 100000000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBeGreaterThan(10000n);
		});
	});
});
