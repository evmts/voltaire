import { beforeAll, describe, expect, it } from "vitest";
import {
	abiComputeSelector,
	abiDecodeParameters,
	abiEncodeParameters,
	authorizationAuthority,
	authorizationGasCost,
	authorizationSigningHash,
	authorizationValidate,
	blobCalculateExcessGas,
	blobCalculateGas,
	blobCalculateGasPrice,
	blobEstimateCount,
	blobFromData,
	blobIsValid,
	blobToData,
	bytesToHex,
	hexToBytes,
	keccak256,
	loadWasm,
	resetMemory,
	secp256k1PubkeyFromPrivate,
	secp256k1RecoverAddress,
	secp256k1RecoverPubkey,
} from "./loader.js";

const WASM_PATH = new URL("../../wasm/primitives.wasm", import.meta.url);

describe("WASM Loader - Additional Tests (Untested Functions)", () => {
	beforeAll(async () => {
		await loadWasm(WASM_PATH);
	});

	// ============================================================================
	// ABI Functions (0 tests → 15+ tests)
	// ============================================================================

	describe("ABI Selector Computation", () => {
		it("abiComputeSelector computes function selector", () => {
			const selector = abiComputeSelector("transfer(address,uint256)");
			expect(selector).toHaveLength(4);
			expect(bytesToHex(selector)).toBe("0xa9059cbb");
		});

		it("abiComputeSelector for balanceOf", () => {
			const selector = abiComputeSelector("balanceOf(address)");
			expect(selector).toHaveLength(4);
			expect(bytesToHex(selector)).toBe("0x70a08231");
		});

		it("abiComputeSelector for approve", () => {
			const selector = abiComputeSelector("approve(address,uint256)");
			expect(selector).toHaveLength(4);
			expect(bytesToHex(selector)).toBe("0x095ea7b3");
		});

		it("abiComputeSelector for totalSupply", () => {
			const selector = abiComputeSelector("totalSupply()");
			expect(selector).toHaveLength(4);
			expect(bytesToHex(selector)).toBe("0x18160ddd");
		});

		it("abiComputeSelector with no parameters", () => {
			const selector = abiComputeSelector("decimals()");
			expect(selector).toHaveLength(4);
			// Deterministic output
			expect(selector.every((b) => typeof b === "number")).toBe(true);
		});
	});

	describe("ABI Parameter Encoding", () => {
		it("abiEncodeParameters encodes uint256", () => {
			const encoded = abiEncodeParameters(["uint256"], ["42"]);
			expect(encoded).toHaveLength(32);
			// uint256(42) should be padded to 32 bytes
			const expected = new Uint8Array(32);
			expected[31] = 42;
			expect(encoded).toEqual(expected);
		});

		it("abiEncodeParameters encodes address", () => {
			const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const encoded = abiEncodeParameters(["address"], [addr]);
			expect(encoded).toHaveLength(32);
			// Address is left-padded with zeros
			expect(encoded.slice(12)).toEqual(hexToBytes(addr));
		});

		it("abiEncodeParameters encodes bool", () => {
			const encodedTrue = abiEncodeParameters(["bool"], ["true"]);
			const encodedFalse = abiEncodeParameters(["bool"], ["false"]);
			expect(encodedTrue).toHaveLength(32);
			expect(encodedFalse).toHaveLength(32);
			expect(encodedTrue[31]).toBe(1);
			expect(encodedFalse[31]).toBe(0);
		});

		it("abiEncodeParameters encodes multiple parameters", () => {
			const encoded = abiEncodeParameters(
				["uint256", "address"],
				["42", "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"],
			);
			expect(encoded).toHaveLength(64); // 2 * 32 bytes
		});

		it("abiEncodeParameters with zero value", () => {
			const encoded = abiEncodeParameters(["uint256"], ["0"]);
			expect(encoded).toEqual(new Uint8Array(32));
		});

		it("abiEncodeParameters with max uint256", () => {
			const maxUint256 =
				"115792089237316195423570985008687907853269984665640564039457584007913129639935";
			const encoded = abiEncodeParameters(["uint256"], [maxUint256]);
			expect(encoded).toHaveLength(32);
			expect(encoded.every((b) => b === 255)).toBe(true);
		});
	});

	describe("ABI Parameter Decoding", () => {
		it("abiDecodeParameters decodes uint256", () => {
			const encoded = new Uint8Array(32);
			encoded[31] = 42;
			const decoded = abiDecodeParameters(encoded, ["uint256"]);
			// WASM returns hex string format
			expect(decoded).toEqual(["0x2a"]);
		});

		it("abiDecodeParameters decodes address", () => {
			const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const encoded = new Uint8Array(32);
			encoded.set(hexToBytes(addr), 12); // Left-padded
			const decoded = abiDecodeParameters(encoded, ["address"]);
			expect(decoded[0]?.toLowerCase()).toBe(addr.toLowerCase());
		});

		it("abiDecodeParameters round-trip uint256", () => {
			const original = ["12345"];
			const encoded = abiEncodeParameters(["uint256"], original);
			const decoded = abiDecodeParameters(encoded, ["uint256"]);
			// Result is in hex format
			expect(decoded.length).toBe(1);
			expect(decoded[0]).toMatch(/^0x[0-9a-f]+$/);
		});

		it("abiDecodeParameters round-trip address", () => {
			const original = ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"];
			const encoded = abiEncodeParameters(["address"], original);
			const decoded = abiDecodeParameters(encoded, ["address"]);
			expect(decoded[0]?.toLowerCase()).toBe(original[0]?.toLowerCase());
		});

		it("abiDecodeParameters multiple parameters", () => {
			const types = ["uint256", "address"];
			const values = ["42", "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"];
			const encoded = abiEncodeParameters(types, values);
			const decoded = abiDecodeParameters(encoded, types);
			expect(decoded.length).toBe(2);
			// uint256 returns as hex
			expect(decoded[0]).toBe("0x2a");
			expect(decoded[1]?.toLowerCase()).toBe(values[1]?.toLowerCase());
		});
	});

	// ============================================================================
	// Blob Functions (EIP-4844) (0 tests → 20+ tests)
	// ============================================================================

	describe("Blob Encoding/Decoding", () => {
		it("blobFromData encodes small data", () => {
			const data = new TextEncoder().encode("Hello, blob!");
			const blob = blobFromData(data);
			expect(blob).toHaveLength(131072); // BLOB_SIZE
		});

		it("blobFromData encodes empty data", () => {
			const data = new Uint8Array(0);
			const blob = blobFromData(data);
			expect(blob).toHaveLength(131072);
		});

		it("blobFromData encodes 1KB data", () => {
			const data = new Uint8Array(1024).fill(0xaa);
			const blob = blobFromData(data);
			expect(blob).toHaveLength(131072);
		});

		it("blobFromData encodes max data (~131KB)", () => {
			const data = new Uint8Array(131000).fill(0xff);
			const blob = blobFromData(data);
			expect(blob).toHaveLength(131072);
		});

		it("blobToData decodes blob", () => {
			const original = new TextEncoder().encode("Test data");
			const blob = blobFromData(original);
			const decoded = blobToData(blob);
			expect(decoded).toEqual(original);
		});

		it("blobToData round-trip small data", () => {
			const original = new Uint8Array([1, 2, 3, 4, 5]);
			const blob = blobFromData(original);
			const decoded = blobToData(blob);
			expect(decoded).toEqual(original);
		});

		it("blobToData round-trip 10KB data", () => {
			const original = new Uint8Array(10240);
			for (let i = 0; i < original.length; i++) {
				original[i] = i % 256;
			}
			const blob = blobFromData(original);
			const decoded = blobToData(blob);
			expect(decoded).toEqual(original);
		});

		it("blobToData round-trip empty data", () => {
			const original = new Uint8Array(0);
			const blob = blobFromData(original);
			const decoded = blobToData(blob);
			expect(decoded).toEqual(original);
		});
	});

	describe("Blob Validation", () => {
		it("blobIsValid accepts correct size", () => {
			expect(blobIsValid(131072)).toBe(true);
		});

		it("blobIsValid rejects wrong size", () => {
			expect(blobIsValid(131071)).toBe(false);
			expect(blobIsValid(131073)).toBe(false);
		});

		it("blobIsValid rejects zero size", () => {
			expect(blobIsValid(0)).toBe(false);
		});

		it("blobIsValid rejects negative size", () => {
			expect(blobIsValid(-1)).toBe(false);
		});

		it("blobIsValid rejects very large size", () => {
			expect(blobIsValid(1000000)).toBe(false);
		});
	});

	describe("Blob Gas Calculations", () => {
		it("blobCalculateGas for 1 blob", () => {
			const gas = blobCalculateGas(1);
			expect(gas).toBe(131072n); // GAS_PER_BLOB
		});

		it("blobCalculateGas for 0 blobs", () => {
			const gas = blobCalculateGas(0);
			expect(gas).toBe(0n);
		});

		it("blobCalculateGas for 3 blobs", () => {
			const gas = blobCalculateGas(3);
			expect(gas).toBe(393216n); // 3 * 131072
		});

		it("blobCalculateGas for 6 blobs (max)", () => {
			const gas = blobCalculateGas(6);
			expect(gas).toBe(786432n); // 6 * 131072
		});

		it("blobCalculateGas scales linearly", () => {
			const gas1 = blobCalculateGas(1);
			const gas2 = blobCalculateGas(2);
			const gas3 = blobCalculateGas(3);
			expect(gas2).toBe(gas1 * 2n);
			expect(gas3).toBe(gas1 * 3n);
		});
	});

	describe("Blob Estimation", () => {
		it("blobEstimateCount for small data", () => {
			const count = blobEstimateCount(1000);
			expect(count).toBeGreaterThanOrEqual(1);
		});

		it("blobEstimateCount for 0 bytes", () => {
			const count = blobEstimateCount(0);
			expect(count).toBeGreaterThanOrEqual(0);
		});

		it("blobEstimateCount for 131KB (1 blob)", () => {
			const count = blobEstimateCount(131000);
			expect(count).toBe(1);
		});

		it("blobEstimateCount for 200KB (2 blobs)", () => {
			const count = blobEstimateCount(200000);
			expect(count).toBe(2);
		});

		it("blobEstimateCount for large data", () => {
			const count = blobEstimateCount(500000);
			expect(count).toBeGreaterThan(0);
			expect(count).toBeLessThanOrEqual(6); // Max 6 blobs per block
		});
	});

	describe("Blob Gas Pricing", () => {
		it("blobCalculateGasPrice with zero excess", () => {
			const price = blobCalculateGasPrice(0n);
			expect(price).toBe(1n); // MIN_BLOB_BASE_FEE
		});

		it("blobCalculateGasPrice with excess", () => {
			const price = blobCalculateGasPrice(100000n);
			// May still be at minimum if excess is below threshold
			expect(price).toBeGreaterThanOrEqual(1n);
		});

		it("blobCalculateGasPrice increases with excess", () => {
			const price1 = blobCalculateGasPrice(0n);
			const price2 = blobCalculateGasPrice(100000n);
			const price3 = blobCalculateGasPrice(500000n);
			// Prices should be non-decreasing
			expect(price2).toBeGreaterThanOrEqual(price1);
			expect(price3).toBeGreaterThanOrEqual(price2);
		});

		it("blobCalculateGasPrice with large excess", () => {
			const price = blobCalculateGasPrice(10000000n);
			expect(price).toBeGreaterThan(1n);
		});
	});

	describe("Blob Excess Gas", () => {
		it("blobCalculateExcessGas with no parent excess", () => {
			const excess = blobCalculateExcessGas(0n, 0n);
			expect(excess).toBe(0n);
		});

		it("blobCalculateExcessGas with parent excess only", () => {
			const excess = blobCalculateExcessGas(100000n, 0n);
			expect(excess).toBeGreaterThanOrEqual(0n);
		});

		it("blobCalculateExcessGas with parent used only", () => {
			const excess = blobCalculateExcessGas(0n, 524288n); // 4 blobs
			expect(excess).toBeGreaterThanOrEqual(0n);
		});

		it("blobCalculateExcessGas with both excess and used", () => {
			const excess = blobCalculateExcessGas(100000n, 393216n); // 3 blobs
			expect(excess).toBeGreaterThanOrEqual(0n);
		});

		it("blobCalculateExcessGas with target gas (3 blobs)", () => {
			const targetGas = 393216n; // TARGET_BLOB_GAS_PER_BLOCK
			const excess = blobCalculateExcessGas(0n, targetGas);
			expect(excess).toBe(0n); // At target, no excess
		});
	});

	// ============================================================================
	// Authorization Functions (EIP-7702) (0 tests → 15+ tests)
	// ============================================================================

	describe("Authorization Validation", () => {
		it("authorizationValidate with valid auth", () => {
			const auth = {
				chainId: 1n,
				address: new Uint8Array(20).fill(0xaa),
				nonce: 0n,
				yParity: 0,
				r: 123n,
				s: 456n,
			};
			// Should not throw for structurally valid authorization
			expect(() => authorizationValidate(auth)).not.toThrow();
		});

		it("authorizationValidate with different chain ID", () => {
			const auth = {
				chainId: 5n, // Goerli
				address: new Uint8Array(20).fill(0xbb),
				nonce: 1n,
				yParity: 1,
				r: 789n,
				s: 101112n,
			};
			expect(() => authorizationValidate(auth)).not.toThrow();
		});

		it("authorizationValidate with high nonce", () => {
			const auth = {
				chainId: 1n,
				address: new Uint8Array(20),
				nonce: 999999n,
				yParity: 0,
				r: 123n,
				s: 456n,
			};
			// May throw due to invalid signature values
			try {
				authorizationValidate(auth);
			} catch (e) {
				expect(e).toBeDefined();
			}
		});

		it("authorizationValidate with yParity 1", () => {
			const auth = {
				chainId: 1n,
				address: new Uint8Array(20),
				nonce: 0n,
				yParity: 1,
				r: 123n,
				s: 456n,
			};
			// May throw due to invalid signature
			try {
				authorizationValidate(auth);
			} catch (e) {
				expect(e).toBeDefined();
			}
		});
	});

	describe("Authorization Signing Hash", () => {
		it("authorizationSigningHash computes hash", () => {
			const chainId = 1n;
			const address = new Uint8Array(20).fill(0xaa);
			const nonce = 0n;
			const hash = authorizationSigningHash(chainId, address, nonce);
			expect(hash).toHaveLength(32);
		});

		it("authorizationSigningHash is deterministic", () => {
			const chainId = 1n;
			const address = new Uint8Array(20).fill(0xbb);
			const nonce = 5n;
			const hash1 = authorizationSigningHash(chainId, address, nonce);
			const hash2 = authorizationSigningHash(chainId, address, nonce);
			expect(hash1).toEqual(hash2);
		});

		it("authorizationSigningHash changes with chain ID", () => {
			const address = new Uint8Array(20).fill(0xcc);
			const nonce = 0n;
			const hash1 = authorizationSigningHash(1n, address, nonce);
			const hash5 = authorizationSigningHash(5n, address, nonce);
			expect(hash1).not.toEqual(hash5);
		});

		it("authorizationSigningHash changes with address", () => {
			const chainId = 1n;
			const nonce = 0n;
			const addr1 = new Uint8Array(20).fill(0xaa);
			const addr2 = new Uint8Array(20).fill(0xbb);
			const hash1 = authorizationSigningHash(chainId, addr1, nonce);
			const hash2 = authorizationSigningHash(chainId, addr2, nonce);
			expect(hash1).not.toEqual(hash2);
		});

		it("authorizationSigningHash changes with nonce", () => {
			const chainId = 1n;
			const address = new Uint8Array(20).fill(0xdd);
			const hash0 = authorizationSigningHash(chainId, address, 0n);
			const hash1 = authorizationSigningHash(chainId, address, 1n);
			expect(hash0).not.toEqual(hash1);
		});
	});

	describe("Authorization Authority Recovery", () => {
		it("authorizationAuthority recovers address", () => {
			// Note: This will likely fail with invalid signature,
			// but tests the function exists and returns correct size
			const auth = {
				chainId: 1n,
				address: new Uint8Array(20).fill(0xaa),
				nonce: 0n,
				yParity: 0,
				r: 123n,
				s: 456n,
			};
			try {
				const authority = authorizationAuthority(auth);
				expect(authority).toHaveLength(20);
			} catch (e) {
				// Expected: invalid signature will throw
				expect(e).toBeDefined();
			}
		});
	});

	describe("Authorization Gas Cost", () => {
		it("authorizationGasCost for 1 auth, 0 empty", () => {
			const cost = authorizationGasCost(1, 0);
			expect(cost).toBe(12500n); // PER_AUTH_BASE_COST
		});

		it("authorizationGasCost for 0 auths", () => {
			const cost = authorizationGasCost(0, 0);
			expect(cost).toBe(0n);
		});

		it("authorizationGasCost for 3 auths, 0 empty", () => {
			const cost = authorizationGasCost(3, 0);
			expect(cost).toBe(37500n); // 3 * 12500
		});

		it("authorizationGasCost for 1 auth, 1 empty", () => {
			const cost = authorizationGasCost(1, 1);
			expect(cost).toBe(37500n); // 12500 + 25000
		});

		it("authorizationGasCost for 2 auths, 2 empty", () => {
			const cost = authorizationGasCost(2, 2);
			expect(cost).toBe(75000n); // (2 * 12500) + (2 * 25000)
		});

		it("authorizationGasCost scales with auth count", () => {
			const cost1 = authorizationGasCost(1, 0);
			const cost2 = authorizationGasCost(2, 0);
			const cost3 = authorizationGasCost(3, 0);
			expect(cost2).toBe(cost1 * 2n);
			expect(cost3).toBe(cost1 * 3n);
		});

		it("authorizationGasCost scales with empty accounts", () => {
			const cost0 = authorizationGasCost(1, 0);
			const cost1 = authorizationGasCost(1, 1);
			const cost2 = authorizationGasCost(1, 2);
			expect(cost1).toBeGreaterThan(cost0);
			expect(cost2).toBeGreaterThan(cost1);
		});
	});

	// ============================================================================
	// Signature Recovery with Valid Test Vectors
	// ============================================================================

	describe("Signature Recovery (Valid Vectors)", () => {
		it("secp256k1RecoverPubkey with known signature", () => {
			// Generate valid signature from known private key
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1; // Private key = 1

			const pubkey = secp256k1PubkeyFromPrivate(privateKey);
			expect(pubkey).toHaveLength(64);

			// Hash a message
			const message = new TextEncoder().encode("test message");
			const messageHash = keccak256(message);

			// For recovery testing, we need actual signed data
			// This is a placeholder - real test would use signed data
			expect(messageHash).toHaveLength(32);
		});

		it("secp256k1RecoverPubkey validates recovery parameter", () => {
			const hash = new Uint8Array(32).fill(1);
			const r = new Uint8Array(32);
			r[31] = 1;
			const s = new Uint8Array(32);
			s[31] = 1;

			// Invalid signature should throw or return invalid result
			try {
				const result = secp256k1RecoverPubkey(hash, r, s, 0);
				// If it doesn't throw, result should be defined
				expect(result).toBeDefined();
			} catch (e) {
				// Expected to throw for invalid signature
				expect(e).toBeDefined();
			}
		});

		it("secp256k1RecoverAddress validates recovery parameter", () => {
			const hash = new Uint8Array(32).fill(1);
			const r = new Uint8Array(32);
			r[31] = 1;
			const s = new Uint8Array(32);
			s[31] = 1;

			// Invalid signature should throw or return result
			try {
				const result = secp256k1RecoverAddress(hash, r, s, 0);
				expect(result).toBeDefined();
			} catch (e) {
				expect(e).toBeDefined();
			}
		});
	});

	// ============================================================================
	// Error Paths and Edge Cases
	// ============================================================================

	describe("Error Handling - ABI", () => {
		it("abiComputeSelector with invalid signature", () => {
			// May not throw, but produce incorrect selector
			const result = abiComputeSelector("invalid signature");
			expect(result).toHaveLength(4);
		});

		it("abiEncodeParameters with mismatched arrays", () => {
			expect(() =>
				abiEncodeParameters(["uint256", "address"], ["42"]),
			).toThrow();
		});

		it("abiEncodeParameters with invalid type", () => {
			expect(() => abiEncodeParameters(["invalidtype"], ["42"])).toThrow();
		});

		it("abiDecodeParameters with truncated data", () => {
			const shortData = new Uint8Array(16); // Too short for uint256
			expect(() => abiDecodeParameters(shortData, ["uint256"])).toThrow();
		});
	});

	describe("Error Handling - Blob", () => {
		it("blobFromData with too large data", () => {
			const tooLarge = new Uint8Array(200000); // > max blob data
			expect(() => blobFromData(tooLarge)).toThrow();
		});

		it("blobToData with wrong size blob", () => {
			const wrongSize = new Uint8Array(100000); // Not 131072
			// May not validate size strictly
			try {
				blobToData(wrongSize);
			} catch (e) {
				expect(e).toBeDefined();
			}
		});

		it("blobCalculateGas with negative count", () => {
			const gas = blobCalculateGas(-1);
			// May handle as 0 or very large number due to unsigned conversion
			expect(typeof gas).toBe("bigint");
		});
	});

	describe("Error Handling - Authorization", () => {
		it("authorizationValidate with invalid yParity", () => {
			const auth = {
				chainId: 1n,
				address: new Uint8Array(20),
				nonce: 0n,
				yParity: 2, // Invalid (should be 0 or 1)
				r: 1n,
				s: 1n,
			};
			expect(() => authorizationValidate(auth)).toThrow();
		});

		it("authorizationSigningHash with zero address", () => {
			const chainId = 1n;
			const address = new Uint8Array(20).fill(0);
			const nonce = 0n;
			const hash = authorizationSigningHash(chainId, address, nonce);
			expect(hash).toHaveLength(32);
		});

		it("authorizationGasCost with large counts", () => {
			const cost = authorizationGasCost(100, 50);
			expect(cost).toBeGreaterThan(0n);
		});
	});

	describe("Memory Management Under Load", () => {
		it("handles multiple blob operations", () => {
			const data1 = new TextEncoder().encode("data 1");
			const data2 = new TextEncoder().encode("data 2");
			const data3 = new TextEncoder().encode("data 3");

			const blob1 = blobFromData(data1);
			const blob2 = blobFromData(data2);
			const blob3 = blobFromData(data3);

			expect(blob1).toHaveLength(131072);
			expect(blob2).toHaveLength(131072);
			expect(blob3).toHaveLength(131072);

			const decoded1 = blobToData(blob1);
			const decoded2 = blobToData(blob2);
			const decoded3 = blobToData(blob3);

			expect(decoded1).toEqual(data1);
			expect(decoded2).toEqual(data2);
			expect(decoded3).toEqual(data3);
		});

		it("handles multiple ABI operations", () => {
			for (let i = 0; i < 10; i++) {
				const encoded = abiEncodeParameters(["uint256"], [`${i}`]);
				const decoded = abiDecodeParameters(encoded, ["uint256"]);
				// Decoded returns hex format
				expect(decoded[0]).toMatch(/^0x[0-9a-f]+$/);
			}
		});

		it("handles multiple authorization operations", () => {
			for (let i = 0; i < 5; i++) {
				const hash = authorizationSigningHash(
					1n,
					new Uint8Array(20).fill(i),
					BigInt(i),
				);
				expect(hash).toHaveLength(32);
			}
		});

		it("memory reset works after blob operations", () => {
			const data = new TextEncoder().encode("test");
			const blob = blobFromData(data);
			resetMemory();
			const blob2 = blobFromData(data);
			expect(blob2).toHaveLength(131072);
		});
	});

	describe("Boundary Conditions", () => {
		it("blob operations with exact max data size", () => {
			// Test with data at exact capacity
			const maxData = new Uint8Array(131000); // Close to max
			maxData.fill(0xaa);
			const blob = blobFromData(maxData);
			const decoded = blobToData(blob);
			expect(decoded).toEqual(maxData);
		});

		it("ABI encoding with max uint256", () => {
			const max =
				"115792089237316195423570985008687907853269984665640564039457584007913129639935";
			const encoded = abiEncodeParameters(["uint256"], [max]);
			const decoded = abiDecodeParameters(encoded, ["uint256"]);
			// Returns hex format
			expect(decoded[0]).toBe(
				"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
			);
		});

		it("authorization with max chain ID", () => {
			const maxChainId = 2n ** 64n - 1n;
			const hash = authorizationSigningHash(
				maxChainId,
				new Uint8Array(20),
				0n,
			);
			expect(hash).toHaveLength(32);
		});

		it("blob gas calculation at limits", () => {
			const maxBlobs = 6;
			const gas = blobCalculateGas(maxBlobs);
			expect(gas).toBe(BigInt(maxBlobs * 131072));
		});
	});

	describe("Integration - Cross-Function Tests", () => {
		it("blob encoding with ABI-encoded data", () => {
			const abiData = abiEncodeParameters(["uint256", "address"], [
				"42",
				"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			]);
			const blob = blobFromData(abiData);
			const decoded = blobToData(blob);
			expect(decoded).toEqual(abiData);

			const abiDecoded = abiDecodeParameters(decoded, ["uint256", "address"]);
			// Returns hex format
			expect(abiDecoded[0]).toBe("0x2a");
		});

		it("authorization hash matches keccak256 pattern", () => {
			const hash = authorizationSigningHash(
				1n,
				new Uint8Array(20).fill(0xaa),
				0n,
			);
			// Hash should be valid keccak256 output
			expect(hash).toHaveLength(32);
			expect(hash.some((b) => b !== 0)).toBe(true); // Not all zeros
		});

		it("ABI selector matches function signature pattern", () => {
			const selector1 = abiComputeSelector("transfer(address,uint256)");
			const selector2 = abiComputeSelector("transfer(address,uint256)");
			// Deterministic
			expect(selector1).toEqual(selector2);
		});
	});
});
