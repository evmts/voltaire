import { describe, expect, it } from "vitest";
import { contractAddress } from "./contractAddress.js";

describe("Keccak256.contractAddress", () => {
	describe("basic functionality", () => {
		it("should compute contract address from sender and nonce", () => {
			const sender = new Uint8Array(20).fill(0x12);
			const nonce = 0n;

			const result = contractAddress(sender, nonce);

			expect(result.length).toBe(20);
			expect(result).toBeInstanceOf(Uint8Array);
		});

		it("should return 20-byte address", () => {
			const sender = new Uint8Array(20);
			const nonce = 1n;

			const result = contractAddress(sender, nonce);

			expect(result.length).toBe(20);
		});
	});

	describe("validation", () => {
		it("should throw for sender with wrong length", () => {
			const wrongLengths = [0, 19, 21, 32];

			for (const length of wrongLengths) {
				const sender = new Uint8Array(length);
				expect(() => contractAddress(sender, 0n)).toThrow("20 bytes");
			}
		});

		it("should accept 20-byte sender", () => {
			const sender = new Uint8Array(20);
			const result = contractAddress(sender, 0n);

			expect(result.length).toBe(20);
		});
	});

	describe("nonce handling", () => {
		it("should handle nonce = 0", () => {
			const sender = new Uint8Array(20).fill(0x01);
			const result = contractAddress(sender, 0n);

			expect(result.length).toBe(20);
		});

		it("should handle nonce = 1", () => {
			const sender = new Uint8Array(20).fill(0x01);
			const result = contractAddress(sender, 1n);

			expect(result.length).toBe(20);
		});

		it("should handle small nonce", () => {
			const sender = new Uint8Array(20).fill(0x01);
			const result = contractAddress(sender, 42n);

			expect(result.length).toBe(20);
		});

		it("should handle large nonce", () => {
			const sender = new Uint8Array(20).fill(0x01);
			const result = contractAddress(sender, 1000000n);

			expect(result.length).toBe(20);
		});

		it("should handle very large nonce", () => {
			const sender = new Uint8Array(20).fill(0x01);
			const result = contractAddress(sender, 0xffffffffffffffffn);

			expect(result.length).toBe(20);
		});
	});

	describe("determinism", () => {
		it("should produce same address for same sender and nonce", () => {
			const sender = new Uint8Array(20);
			for (let i = 0; i < 20; i++) {
				sender[i] = i;
			}

			const addr1 = contractAddress(sender, 5n);
			const addr2 = contractAddress(sender, 5n);

			expect(addr1).toEqual(addr2);
		});

		it("should produce different addresses for different nonces", () => {
			const sender = new Uint8Array(20).fill(0x42);

			const addr0 = contractAddress(sender, 0n);
			const addr1 = contractAddress(sender, 1n);
			const addr2 = contractAddress(sender, 2n);

			expect(addr0).not.toEqual(addr1);
			expect(addr0).not.toEqual(addr2);
			expect(addr1).not.toEqual(addr2);
		});

		it("should produce different addresses for different senders", () => {
			const sender1 = new Uint8Array(20).fill(0x01);
			const sender2 = new Uint8Array(20).fill(0x02);

			const addr1 = contractAddress(sender1, 0n);
			const addr2 = contractAddress(sender2, 0n);

			expect(addr1).not.toEqual(addr2);
		});
	});

	describe("sequential nonces", () => {
		it("should produce different addresses for sequential nonces", () => {
			const sender = new Uint8Array(20);
			sender[19] = 0xaa;

			const addresses = [];
			for (let i = 0n; i < 10n; i++) {
				addresses.push(contractAddress(sender, i));
			}

			// All should be unique
			for (let i = 0; i < addresses.length; i++) {
				for (let j = i + 1; j < addresses.length; j++) {
					expect(addresses[i]).not.toEqual(addresses[j]);
				}
			}
		});
	});

	describe("edge cases", () => {
		it("should handle all-zero sender", () => {
			const sender = new Uint8Array(20);
			const result = contractAddress(sender, 0n);

			expect(result.length).toBe(20);
			// Result should not be all zeros
			const isAllZeros = result.every((byte) => byte === 0);
			expect(isAllZeros).toBe(false);
		});

		it("should handle all-ones sender", () => {
			const sender = new Uint8Array(20).fill(0xff);
			const result = contractAddress(sender, 0n);

			expect(result.length).toBe(20);
		});

		it("should handle maximum nonce for uint64", () => {
			const sender = new Uint8Array(20).fill(0x42);
			const maxNonce = 0xffffffffffffffffn;

			const result = contractAddress(sender, maxNonce);

			expect(result.length).toBe(20);
		});
	});

	describe("Ethereum address patterns", () => {
		it("should generate different addresses from well-known patterns", () => {
			// Zero address
			const zero = new Uint8Array(20);
			// Burn address
			const burn = new Uint8Array(20);
			burn[19] = 0xde;
			burn[18] = 0xad;
			// Sample address
			const sample = new Uint8Array(20);
			for (let i = 0; i < 20; i++) {
				sample[i] = i * 13;
			}

			const zeroAddr = contractAddress(zero, 0n);
			const burnAddr = contractAddress(burn, 0n);
			const sampleAddr = contractAddress(sample, 0n);

			expect(zeroAddr).not.toEqual(burnAddr);
			expect(zeroAddr).not.toEqual(sampleAddr);
			expect(burnAddr).not.toEqual(sampleAddr);
		});
	});

	describe("first contract deployment", () => {
		it("should compute first contract address (nonce = 0)", () => {
			const sender = new Uint8Array(20);
			// Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
			sender[0] = 0x74;
			sender[1] = 0x2d;
			sender[19] = 0xeb;

			const result = contractAddress(sender, 0n);

			expect(result.length).toBe(20);
		});

		it("should compute second contract address (nonce = 1)", () => {
			const sender = new Uint8Array(20);
			sender[0] = 0x74;
			sender[1] = 0x2d;
			sender[19] = 0xeb;

			const result = contractAddress(sender, 1n);

			expect(result.length).toBe(20);
		});
	});

	describe("nonce progression", () => {
		it("should handle typical nonce progression", () => {
			const sender = new Uint8Array(20);
			for (let i = 0; i < 20; i++) {
				sender[i] = (i * 7) % 256;
			}

			// Typical contract deployment scenario
			const nonces = [0n, 1n, 2n, 3n, 4n, 5n];
			const addresses = nonces.map((nonce) => contractAddress(sender, nonce));

			// All should be unique
			const uniqueAddresses = new Set(addresses.map((a) => a.join(",")));
			expect(uniqueAddresses.size).toBe(addresses.length);
		});
	});

	describe("multiple senders", () => {
		it("should produce different addresses for multiple senders at same nonce", () => {
			const nonce = 0n;
			const addresses = [];

			for (let i = 0; i < 10; i++) {
				const sender = new Uint8Array(20).fill(i);
				addresses.push(contractAddress(sender, nonce));
			}

			// All should be unique
			for (let i = 0; i < addresses.length; i++) {
				for (let j = i + 1; j < addresses.length; j++) {
					expect(addresses[i]).not.toEqual(addresses[j]);
				}
			}
		});
	});

	describe("contract factory pattern", () => {
		it("should simulate contract factory deploying multiple contracts", () => {
			const factory = new Uint8Array(20);
			factory[19] = 0xfa; // Factory address ending in 0xfa

			const deployedContracts = [];
			for (let i = 0n; i < 5n; i++) {
				deployedContracts.push(contractAddress(factory, i));
			}

			// All deployed contracts should have unique addresses
			const uniqueAddresses = new Set(deployedContracts.map((a) => a.join(",")));
			expect(uniqueAddresses.size).toBe(deployedContracts.length);
		});
	});

	describe("address derivation properties", () => {
		it("should derive address that is deterministic", () => {
			const sender = new Uint8Array(20);
			sender[10] = 0xab;
			const nonce = 123n;

			// Call multiple times
			const addresses = [];
			for (let i = 0; i < 3; i++) {
				addresses.push(contractAddress(sender, nonce));
			}

			// All should be identical
			expect(addresses[0]).toEqual(addresses[1]);
			expect(addresses[1]).toEqual(addresses[2]);
		});

		it("should derive address that varies with input", () => {
			const sender = new Uint8Array(20);
			sender[10] = 0xab;

			const addresses = new Set();
			for (let nonce = 0n; nonce < 20n; nonce++) {
				const addr = contractAddress(sender, nonce);
				const key = addr.join(",");
				addresses.add(key);
			}

			// Should have 20 unique addresses
			expect(addresses.size).toBe(20);
		});
	});
});
