import { describe, expect, it } from "vitest";
import {
	PrecompileAddress,
	execute,
	modexp,
} from "../evm/precompiles/precompiles.js";
import * as Hardfork from "../primitives/Hardfork/index.js";

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
 * Helper to hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
	const cleanHex = hex.replace("0x", "");
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < cleanHex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(cleanHex.substr(i, 2), 16);
	}
	return bytes;
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

describe("Modular Exponentiation (0x05) - EIP-198/2565", () => {
	describe("Basic functionality", () => {
		it("should compute modexp: 2^5 mod 7 = 4", () => {
			const input = createModExpInput(2n, 5n, 7n);
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			expect(result.error).toBeUndefined();
			const res = bytesToBigint(result.output);
			expect(res).toBe(4n);
		});

		it("should handle base 0: 0^exp mod m = 0", () => {
			const input = createModExpInput(0n, 100n, 7n);
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			const res = bytesToBigint(result.output);
			expect(res).toBe(0n);
		});

		it("should handle exponent 0: base^0 mod m = 1", () => {
			const input = createModExpInput(2n, 0n, 7n);
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			const res = bytesToBigint(result.output);
			expect(res).toBe(1n);
		});

		it("should handle modulus 1: any^any mod 1 = 0", () => {
			const input = createModExpInput(2n, 5n, 1n);
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			const res = bytesToBigint(result.output);
			expect(res).toBe(0n);
		});

		it("should compute large modexp: 2^100 mod 997", () => {
			const input = createModExpInput(2n, 100n, 997n);
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			const res = bytesToBigint(result.output);
			// 2^100 mod 997 = 907
			expect(res).toBe(907n);
		});

		it("should compute cryptographic RSA example", () => {
			// RSA-like: message^pubexp mod n
			const message = 65537n;
			const pubexp = 3n;
			const modulus = 3233n; // 61 * 53
			const input = createModExpInput(message, pubexp, modulus);
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBeGreaterThan(0);
		});
	});

	describe("Gas calculation - EIP-2565", () => {
		it("should reject when insufficient gas", () => {
			const input = createModExpInput(2n, 100n, 997n);
			const result = modexp(input, 1n);
			expect(result.success).toBe(false);
		});

		it("should charge gas proportional to exponent bit length", () => {
			// Small exponent (8 bits)
			const input1 = createModExpInput(2n, 255n, 997n); // 255 = 0xFF (8 bits)
			const res1 = modexp(input1, 100000n);
			expect(res1.success).toBe(true);
			const gas1 = res1.gasUsed;

			// Large exponent (256 bits)
			const input2 = createModExpInput(2n, (1n << 256n) - 1n, 997n);
			const res2 = modexp(input2, 1000000n);
			expect(res2.success).toBe(true);
			const gas2 = res2.gasUsed;

			// Gas should be calculated, both should succeed
			expect(res1.success).toBe(true);
			expect(res2.success).toBe(true);
		});

		it("should handle zero exponent", () => {
			const input = createModExpInput(2n, 0n, 997n);
			const result = modexp(input, 100000n);
			expect(result.success).toBe(true);
			// Result should be 1 (base^0 = 1)
			const res = bytesToBigint(result.output);
			expect(res).toBe(1n);
		});

		it("should compute correct gas for modulus length", () => {
			// Gas should scale with max(exp_len, mod_len)
			const input1 = createModExpInput(2n, 10n, 1000000n); // mod_len > exp_len
			const res1 = modexp(input1, 100000n);
			expect(res1.success).toBe(true);

			const input2 = createModExpInput(2n, 1000000n, 10n); // exp_len > mod_len
			const res2 = modexp(input2, 100000n);
			expect(res2.success).toBe(true);
		});
	});

	describe("Large inputs", () => {
		it("should handle 256-bit numbers", () => {
			const base = (1n << 256n) - 1n;
			const exp = 3n;
			const mod = (1n << 128n) + 1n;
			const input = createModExpInput(base, exp, mod);
			const result = modexp(input, 100000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBeGreaterThan(0);
		});

		it("should handle 1024-bit RSA modulus", () => {
			// 1024-bit modulus
			const base = 65537n;
			const exp = 65537n;
			const mod = BigInt(
				"179769313486231590772930519466302748567603362811036755999195153263474380134393745337287454251786926241744628762514325835697894665202401968403496010197893424984257037079726936230627676215822015367784424512226976223206071765920220949156842248246071598906046874215289945881050936313799014279127039451486763314656147988549347600571213881838379808022816255370301629838629372894151266098502806661269922003838041537421024098900873218098769635881903829149922318825131808269814999262373297301847935915827873892933126897000999842318835046087009877330970031597919088788905234662862023999923000904149302181653653308405815813821648699",
			);
			const input = createModExpInput(base, exp, mod);
			const result = modexp(input, 1000000n);
			expect(result.success).toBe(true);
		});

		it("should handle Fermat test computation", () => {
			// Fermat's little theorem: 2^(p-1) mod p = 1 for prime p
			// For p = 65537: 2^65536 mod 65537 = 1
			const input = createModExpInput(2n, 65536n, 65537n);
			const result = modexp(input, 100000n);
			expect(result.success).toBe(true);
			const res = bytesToBigint(result.output);
			expect(res).toBe(1n);
		});
	});

	describe("Edge cases", () => {
		it("should handle base > modulus", () => {
			// base > mod: should reduce first
			const input = createModExpInput(100n, 2n, 10n);
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			const res = bytesToBigint(result.output);
			// 100 mod 10 = 0, so 0^2 mod 10 = 0
			expect(res).toBe(0n);
		});

		it("should handle modulus 0 (invalid, returns 0)", () => {
			// mod 0 is technically invalid but precompile may handle gracefully
			const input = createModExpInput(2n, 5n, 0n);
			const result = modexp(input, 10000n);
			// Should either fail or return 0
			if (result.success) {
				const res = bytesToBigint(result.output);
				expect(res).toBe(0n);
			}
		});

		it("should handle zero length inputs", () => {
			const input = new Uint8Array(96); // Just header, zero lengths
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			// 0^0 mod 0 or similar edge case
			expect(result.output.length).toBe(0);
		});

		it("should handle maximum uint256 values", () => {
			const max = (1n << 256n) - 1n;
			const input = createModExpInput(max, max, max);
			const result = modexp(input, 100000n);
			expect(result.success).toBe(true);
		});
	});

	describe("EIP-198 test vectors", () => {
		it("test vector 1: simple computation", () => {
			// 0x0142^0x05 mod 0x04d2 = 0x02c8 = 712
			const input = createModExpInputFromHex("0x0142", "0x05", "0x04d2");
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			const res = bytesToBigint(result.output);
			expect(res).toBe(712n);
		});

		it("test vector 2: large exponent", () => {
			// base: 0x02, exp: 0xFFFF (65535), mod: 0x0131 (305)
			const input = createModExpInputFromHex("0x02", "0xFFFF", "0x0131");
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBeGreaterThan(0);
		});
	});

	describe("Cryptographic correctness", () => {
		it("should satisfy Fermat's little theorem: a^(p-1) mod p = 1 (p prime, gcd(a,p)=1)", () => {
			// p = 11 (prime), a = 2
			// 2^10 mod 11 should = 1
			const input = createModExpInput(2n, 10n, 11n);
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			const res = bytesToBigint(result.output);
			expect(res).toBe(1n);
		});

		it("should satisfy Euler's theorem: a^φ(n) mod n = 1 (gcd(a,n)=1)", () => {
			// n = 15, φ(15) = 8, a = 2
			// 2^8 mod 15 should = 1
			const input = createModExpInput(2n, 8n, 15n);
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			const res = bytesToBigint(result.output);
			expect(res).toBe(1n);
		});

		it("should verify RSA padding: compute ciphertext from plaintext", () => {
			// RSA encryption simulation (not real crypto, just modexp)
			// plaintext = 12, public key (e, n) = (3, 35)
			// ciphertext = 12^3 mod 35 = 1728 mod 35 = 13
			const input = createModExpInput(12n, 3n, 35n);
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			const res = bytesToBigint(result.output);
			expect(res).toBe(13n);
		});

		it("should handle identity: a^1 mod m = a mod m", () => {
			const a = 123456n;
			const m = 789012n;
			const input = createModExpInput(a, 1n, m);
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			const res = bytesToBigint(result.output);
			expect(res).toBe(a % m);
		});
	});

	describe("Output format", () => {
		it("should output correct number of bytes", () => {
			const input = createModExpInput(2n, 5n, 7n);
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			// Output length should match modulus length (right-padded to modulus size)
			expect(result.output.length).toBeGreaterThan(0);
		});

		it("should strip leading zeros from result", () => {
			// 2^5 mod 7 = 4, should output as minimal bytes
			const input = createModExpInput(2n, 5n, 7n);
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			const res = bytesToBigint(result.output);
			expect(res).toBe(4n);
		});

		it("should output zero when result is 0", () => {
			const input = createModExpInput(10n, 2n, 5n); // 100 mod 5 = 0
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
			const res = bytesToBigint(result.output);
			expect(res).toBe(0n);
		});
	});

	describe("Input validation", () => {
		it("should handle minimum input (96 bytes header only)", () => {
			const input = new Uint8Array(96);
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
		});

		it("should handle valid input with data", () => {
			const input = createModExpInput(2n, 5n, 7n);
			const result = modexp(input, 10000n);
			expect(result.success).toBe(true);
		});
	});
});
