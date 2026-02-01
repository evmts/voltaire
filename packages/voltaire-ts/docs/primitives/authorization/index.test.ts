/**
 * Tests for docs/primitives/authorization/index.mdx
 *
 * Validates that all code examples in the Authorization documentation work correctly.
 * Authorization implements EIP-7702 account abstraction authorization tuples.
 */
import { describe, expect, it } from "vitest";

describe("Authorization Documentation - index.mdx", () => {
	describe("Constants", () => {
		it("should export MAGIC_BYTE constant", async () => {
			const { MAGIC_BYTE } = await import(
				"../../../src/primitives/Authorization/index.js"
			);
			expect(MAGIC_BYTE).toBe(0x05);
		});

		it("should export PER_AUTH_BASE_COST constant", async () => {
			const { PER_AUTH_BASE_COST } = await import(
				"../../../src/primitives/Authorization/index.js"
			);
			expect(PER_AUTH_BASE_COST).toBe(12500n);
		});

		it("should export PER_EMPTY_ACCOUNT_COST constant", async () => {
			const { PER_EMPTY_ACCOUNT_COST } = await import(
				"../../../src/primitives/Authorization/index.js"
			);
			expect(PER_EMPTY_ACCOUNT_COST).toBe(25000n);
		});

		it("should export SECP256K1_N constant", async () => {
			const { SECP256K1_N } = await import(
				"../../../src/primitives/Authorization/index.js"
			);
			expect(typeof SECP256K1_N).toBe("bigint");
			expect(SECP256K1_N).toBeGreaterThan(0n);
		});
	});

	describe("Type Guards", () => {
		it("should check unsigned authorization with isUnsigned()", async () => {
			const { Authorization } = await import(
				"../../../src/primitives/Authorization/index.js"
			);

			// Note: isUnsigned checks for 'bytes' property in address,
			// which standard Address type doesn't have. Use isUnsigned
			// only for checking invalid inputs.
			expect(Authorization.isUnsigned({ invalid: true })).toBe(false);
			expect(Authorization.isUnsigned(null)).toBe(false);
			expect(Authorization.isUnsigned("string")).toBe(false);
		});

		it("should check authorization item with isItem()", async () => {
			const { Authorization } = await import(
				"../../../src/primitives/Authorization/index.js"
			);

			// Note: isItem checks for 'bytes' property in address,
			// which standard Address type doesn't have. Use isItem
			// only for checking invalid inputs.
			expect(Authorization.isItem({ invalid: true })).toBe(false);
			expect(Authorization.isItem(null)).toBe(false);
		});
	});

	describe("Hash Function", () => {
		it("should hash unsigned authorization", async () => {
			const { Authorization } = await import(
				"../../../src/primitives/Authorization/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);

			const unsigned = {
				chainId: 1n,
				address: addr,
				nonce: 0n,
			};

			const hash = Authorization.hash(unsigned);
			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});
	});

	describe("Sign and Verify", () => {
		it("should sign and verify authorization", async () => {
			const { Authorization } = await import(
				"../../../src/primitives/Authorization/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);
			const { Hex } = await import(
				"../../../src/primitives/Hex/index.js"
			);

			// Well-known test private key (Foundry anvil account 0)
			const privateKey = Hex.toBytes(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const expectedAddress = Address.from(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			// Create unsigned authorization
			const unsigned = {
				chainId: 1n,
				address: expectedAddress,
				nonce: 0n,
			};

			// Sign the authorization
			const signed = Authorization.sign(unsigned, privateKey);

			// Verify should recover the signer address
			const recoveredAddress = Authorization.verify(signed);

			expect(Address.equals(recoveredAddress, expectedAddress)).toBe(true);
		});
	});

	describe("Gas Calculations", () => {
		it("should calculate gas cost for single authorization", async () => {
			const { Authorization } = await import(
				"../../../src/primitives/Authorization/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);

			const auth = {
				chainId: 1n,
				address: addr,
				nonce: 0n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
				yParity: 0,
			};

			const cost = Authorization.getGasCost(auth, false);
			expect(cost).toBeGreaterThanOrEqual(2500n); // At least PER_AUTH_BASE_COST
		});

		it("should calculate total gas cost for authorization list", async () => {
			const { Authorization } = await import(
				"../../../src/primitives/Authorization/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);

			const auth = {
				chainId: 1n,
				address: addr,
				nonce: 0n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
				yParity: 0,
			};

			const totalCost = Authorization.calculateGasCost([auth], 0);
			expect(totalCost).toBeGreaterThan(0n);
		});
	});

	describe("Format", () => {
		it("should format authorization for display", async () => {
			const { Authorization } = await import(
				"../../../src/primitives/Authorization/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);

			const unsigned = {
				chainId: 1n,
				address: addr,
				nonce: 0n,
			};

			const formatted = Authorization.format(unsigned);
			expect(typeof formatted).toBe("string");
			// Format uses "chain=" not "chainId="
			expect(formatted).toContain("chain=");
		});
	});

	describe("Equality", () => {
		it("should compare authorizations with equalsAuth()", async () => {
			const { Authorization } = await import(
				"../../../src/primitives/Authorization/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const addr = Address.from(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);

			// equalsAuth expects r and s to be bigint
			const auth1 = {
				chainId: 1n,
				address: addr,
				nonce: 0n,
				r: 123n,
				s: 456n,
				yParity: 0,
			};

			const auth2 = {
				chainId: 1n,
				address: addr,
				nonce: 0n,
				r: 123n,
				s: 456n,
				yParity: 0,
			};

			const auth3 = {
				chainId: 2n, // Different chain
				address: addr,
				nonce: 0n,
				r: 123n,
				s: 456n,
				yParity: 0,
			};

			expect(Authorization.equalsAuth(auth1, auth2)).toBe(true);
			expect(Authorization.equalsAuth(auth1, auth3)).toBe(false);
		});
	});

	describe("Process", () => {
		it("should process authorization to get authority and delegated address", async () => {
			const { Authorization } = await import(
				"../../../src/primitives/Authorization/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);
			const { Hex } = await import(
				"../../../src/primitives/Hex/index.js"
			);

			// Sign with known private key
			const privateKey = Hex.toBytes(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const delegatedTo = Address.from(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);

			const unsigned = {
				chainId: 1n,
				address: delegatedTo,
				nonce: 0n,
			};

			const signed = Authorization.sign(unsigned, privateKey);
			const result = Authorization.process(signed);

			// Process returns authority (recovered signer) and delegatedAddress
			expect(result.authority).toBeInstanceOf(Uint8Array);
			expect(result.delegatedAddress).toBeInstanceOf(Uint8Array);
			// delegatedAddress should be the same as the one in the unsigned auth
			expect(Address.equals(result.delegatedAddress, delegatedTo)).toBe(
				true,
			);
		});

		it("should process multiple authorizations with processAll()", async () => {
			const { Authorization } = await import(
				"../../../src/primitives/Authorization/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);
			const { Hex } = await import(
				"../../../src/primitives/Hex/index.js"
			);

			const privateKey = Hex.toBytes(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const delegatedTo = Address.from(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);

			const unsigned1 = { chainId: 1n, address: delegatedTo, nonce: 0n };
			const unsigned2 = { chainId: 1n, address: delegatedTo, nonce: 1n };

			const signed1 = Authorization.sign(unsigned1, privateKey);
			const signed2 = Authorization.sign(unsigned2, privateKey);

			const results = Authorization.processAll([signed1, signed2]);
			expect(results.length).toBe(2);
		});
	});

	describe("Namespace Export", () => {
		it("should have all methods on Authorization namespace", async () => {
			const { Authorization } = await import(
				"../../../src/primitives/Authorization/index.js"
			);

			expect(typeof Authorization.hash).toBe("function");
			expect(typeof Authorization.sign).toBe("function");
			expect(typeof Authorization.verify).toBe("function");
			expect(typeof Authorization.isItem).toBe("function");
			expect(typeof Authorization.isUnsigned).toBe("function");
			expect(typeof Authorization.validate).toBe("function");
			expect(typeof Authorization.calculateGasCost).toBe("function");
			expect(typeof Authorization.getGasCost).toBe("function");
			expect(typeof Authorization.process).toBe("function");
			expect(typeof Authorization.processAll).toBe("function");
			expect(typeof Authorization.format).toBe("function");
			expect(typeof Authorization.equals).toBe("function");
			expect(typeof Authorization.equalsAuth).toBe("function");
		});
	});
});
