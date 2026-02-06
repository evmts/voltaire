/**
 * Tests for code examples in llm-optimized.mdx
 *
 * This file tests the LLM-optimized design examples.
 * Voltaire's API mirrors Ethereum specifications with minimal abstraction.
 */
import { describe, expect, it } from "vitest";

describe("llm-optimized.mdx examples", () => {
	describe("Mirrors Official Specifications", () => {
		it("imports Address, Keccak256, Abi primitives", async () => {
			const { Address } = await import("../../src/primitives/Address/index.js");
			const Keccak256 = await import("../../src/crypto/Keccak256/index.js");
			const Abi = await import("../../src/primitives/Abi/index.js");

			expect(typeof Address).toBe("function");
			expect(typeof Keccak256.hash).toBe("function");
			expect(Abi.Function).toBeDefined();
		});
	});

	describe("Example - Contract Calls (Abi.Function.encodeParams)", () => {
		it("encodes function parameters for balanceOf", async () => {
			const Abi = await import("../../src/primitives/Abi/index.js");
			const { Address } = await import("../../src/primitives/Address/index.js");

			// The docs show a balanceOf function definition
			const balanceOfFunction = {
				type: "function" as const,
				name: "balanceOf",
				inputs: [{ type: "address" as const, name: "account" }],
				outputs: [{ type: "uint256" as const }],
			};

			const address = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

			// Encode function call data
			const encoded = Abi.Function.encodeParams(balanceOfFunction, [address]);

			expect(encoded).toBeInstanceOf(Uint8Array);
			// Function selector (4 bytes) + encoded address (32 bytes) = 36 bytes
			expect(encoded.length).toBe(36);
		});

		it("gets function selector", async () => {
			const Abi = await import("../../src/primitives/Abi/index.js");

			const balanceOfFunction = {
				type: "function" as const,
				name: "balanceOf",
				inputs: [{ type: "address" as const, name: "account" }],
				outputs: [{ type: "uint256" as const }],
			};

			const selector = Abi.Function.getSelector(balanceOfFunction);

			expect(selector).toBeInstanceOf(Uint8Array);
			expect(selector.length).toBe(4);

			// balanceOf(address) selector is 0x70a08231
			const { Hex } = await import("../../src/primitives/Hex/index.js");
			expect(Hex.fromBytes(selector)).toBe("0x70a08231");
		});
	});

	describe("Unix Philosophy - Low-level primitives", () => {
		it("each primitive does one thing well", async () => {
			const { Address } = await import("../../src/primitives/Address/index.js");
			const Keccak256 = await import("../../src/crypto/Keccak256/index.js");
			const Abi = await import("../../src/primitives/Abi/index.js");

			// Address: handles Ethereum addresses
			const addr = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
			expect(addr.length).toBe(20);

			// Keccak256: handles keccak256 hashing
			const hash = Keccak256.hash(new Uint8Array([1, 2, 3]));
			expect(hash.length).toBe(32);

			// Abi: handles ABI encoding/decoding
			const transferFunction = {
				type: "function" as const,
				name: "transfer",
				inputs: [
					{ type: "address" as const, name: "to" },
					{ type: "uint256" as const, name: "amount" },
				],
				outputs: [{ type: "bool" as const }],
			};

			const encoded = Abi.Function.encodeParams(transferFunction, [addr, 1000n]);
			expect(encoded).toBeInstanceOf(Uint8Array);
		});
	});

	describe("Minimal Abstraction", () => {
		it("explicit retry behavior example structure", async () => {
			// The docs show explicit retry logic rather than hidden retry policies
			// We test the pattern conceptually

			const maxRetries = 3;
			let attempt = 0;
			let succeeded = false;

			// Simulate retry logic pattern from docs (succeeds on second attempt)
			while (attempt < maxRetries) {
				try {
					// Simulated request - fails first time, succeeds second time
					if (attempt >= 1) {
						succeeded = true;
						break;
					}
					throw new Error("Simulated failure");
				} catch {
					attempt++;
					// await sleep(retryDelay * attempt) would go here
				}
			}

			// After first failure, attempt increments to 1
			// Then the second try succeeds and breaks
			expect(attempt).toBe(1);
			expect(succeeded).toBe(true);
		});
	});

	describe("Higher-Level Abstractions (Building Blocks)", () => {
		it("demonstrates customizable contract wrapper pattern", async () => {
			const Abi = await import("../../src/primitives/Abi/index.js");
			const { Address } = await import("../../src/primitives/Address/index.js");

			// The docs show copying abstraction code into your codebase
			// This tests the building block pattern

			const nftAbi = {
				ownerOf: {
					type: "function" as const,
					name: "ownerOf",
					inputs: [{ type: "uint256" as const, name: "tokenId" }],
					outputs: [{ type: "address" as const }],
				},
			};

			const NFT_ADDRESS = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

			// Custom getOwnerOf function following the docs pattern
			function encodeOwnerOfCall(tokenId: bigint) {
				return Abi.Function.encodeParams(nftAbi.ownerOf, [tokenId]);
			}

			const encoded = encodeOwnerOfCall(123n);

			expect(encoded).toBeInstanceOf(Uint8Array);
			// Function selector (4 bytes) + uint256 (32 bytes) = 36 bytes
			expect(encoded.length).toBe(36);
		});
	});

	// API DISCREPANCY: The docs show Provider.request() pattern which is not yet implemented.
	// The primitives focus on encoding/decoding, not network requests.
	describe("Provider pattern (NOT IMPLEMENTED - primitives only)", () => {
		it.skip("Provider.request is not exported from primitives", () => {
			// The docs show:
			// const result = await provider.request({
			//   method: 'eth_call',
			//   params: [{ to, from, data }, { blockNumber: 'latest' }]
			// })
			// This is a higher-level abstraction not in the primitives library.
		});
	});
});
