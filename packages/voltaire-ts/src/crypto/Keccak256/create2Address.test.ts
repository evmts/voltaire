import { describe, expect, it } from "vitest";
import { create2Address } from "./create2Address.js";
import { hash } from "./hash.js";

describe("Keccak256.create2Address", () => {
	describe("basic functionality", () => {
		it("should compute CREATE2 address from sender, salt, and initCodeHash", () => {
			const sender = new Uint8Array(20).fill(0x12);
			const salt = new Uint8Array(32).fill(0x34);
			const initCodeHash = new Uint8Array(32).fill(0x56);

			const result = create2Address(sender, salt, initCodeHash);

			expect(result.length).toBe(20);
			expect(result).toBeInstanceOf(Uint8Array);
		});

		it("should return 20-byte address", () => {
			const sender = new Uint8Array(20);
			const salt = new Uint8Array(32);
			const initCodeHash = new Uint8Array(32);

			const result = create2Address(sender, salt, initCodeHash);

			expect(result.length).toBe(20);
		});
	});

	describe("validation", () => {
		it("should throw for sender with wrong length", () => {
			const salt = new Uint8Array(32);
			const initCodeHash = new Uint8Array(32);

			const wrongLengths = [0, 19, 21, 32];
			for (const length of wrongLengths) {
				const sender = new Uint8Array(length);
				expect(() => create2Address(sender, salt, initCodeHash)).toThrow(
					"20 bytes",
				);
			}
		});

		it("should throw for salt with wrong length", () => {
			const sender = new Uint8Array(20);
			const initCodeHash = new Uint8Array(32);

			const wrongLengths = [0, 31, 33, 64];
			for (const length of wrongLengths) {
				const salt = new Uint8Array(length);
				expect(() => create2Address(sender, salt, initCodeHash)).toThrow(
					"32 bytes",
				);
			}
		});

		it("should throw for initCodeHash with wrong length", () => {
			const sender = new Uint8Array(20);
			const salt = new Uint8Array(32);

			const wrongLengths = [0, 31, 33, 64];
			for (const length of wrongLengths) {
				const initCodeHash = new Uint8Array(length);
				expect(() => create2Address(sender, salt, initCodeHash)).toThrow(
					"32 bytes",
				);
			}
		});

		it("should accept correct lengths", () => {
			const sender = new Uint8Array(20);
			const salt = new Uint8Array(32);
			const initCodeHash = new Uint8Array(32);

			const result = create2Address(sender, salt, initCodeHash);
			expect(result.length).toBe(20);
		});
	});

	describe("CREATE2 formula", () => {
		it("should implement 0xff || sender || salt || initCodeHash", () => {
			const sender = new Uint8Array(20).fill(0xaa);
			const salt = new Uint8Array(32).fill(0xbb);
			const initCodeHash = new Uint8Array(32).fill(0xcc);

			const result = create2Address(sender, salt, initCodeHash);

			// Verify by computing manually
			const data = new Uint8Array(1 + 20 + 32 + 32);
			data[0] = 0xff;
			data.set(sender, 1);
			data.set(salt, 21);
			data.set(initCodeHash, 53);

			const fullHash = hash(data);
			const expected = fullHash.slice(12); // Last 20 bytes

			expect(result).toEqual(expected);
		});
	});

	describe("determinism", () => {
		it("should produce same address for same inputs", () => {
			const sender = new Uint8Array(20);
			for (let i = 0; i < 20; i++) {
				sender[i] = i;
			}
			const salt = new Uint8Array(32).fill(0x42);
			const initCodeHash = new Uint8Array(32).fill(0x99);

			const addr1 = create2Address(sender, salt, initCodeHash);
			const addr2 = create2Address(sender, salt, initCodeHash);

			expect(addr1).toEqual(addr2);
		});

		it("should produce different addresses for different salts", () => {
			const sender = new Uint8Array(20).fill(0x11);
			const salt1 = new Uint8Array(32).fill(0x01);
			const salt2 = new Uint8Array(32).fill(0x02);
			const initCodeHash = new Uint8Array(32).fill(0xaa);

			const addr1 = create2Address(sender, salt1, initCodeHash);
			const addr2 = create2Address(sender, salt2, initCodeHash);

			expect(addr1).not.toEqual(addr2);
		});

		it("should produce different addresses for different senders", () => {
			const sender1 = new Uint8Array(20).fill(0x11);
			const sender2 = new Uint8Array(20).fill(0x22);
			const salt = new Uint8Array(32).fill(0xaa);
			const initCodeHash = new Uint8Array(32).fill(0xbb);

			const addr1 = create2Address(sender1, salt, initCodeHash);
			const addr2 = create2Address(sender2, salt, initCodeHash);

			expect(addr1).not.toEqual(addr2);
		});

		it("should produce different addresses for different initCodeHashes", () => {
			const sender = new Uint8Array(20).fill(0x11);
			const salt = new Uint8Array(32).fill(0xaa);
			const initCodeHash1 = new Uint8Array(32).fill(0x01);
			const initCodeHash2 = new Uint8Array(32).fill(0x02);

			const addr1 = create2Address(sender, salt, initCodeHash1);
			const addr2 = create2Address(sender, salt, initCodeHash2);

			expect(addr1).not.toEqual(addr2);
		});
	});

	describe("salt variations", () => {
		it("should produce different addresses for sequential salts", () => {
			const sender = new Uint8Array(20).fill(0xaa);
			const initCodeHash = new Uint8Array(32).fill(0xbb);

			const addresses = [];
			for (let i = 0; i < 10; i++) {
				const salt = new Uint8Array(32);
				salt[31] = i;
				addresses.push(create2Address(sender, salt, initCodeHash));
			}

			// All should be unique
			for (let i = 0; i < addresses.length; i++) {
				for (let j = i + 1; j < addresses.length; j++) {
					expect(addresses[i]).not.toEqual(addresses[j]);
				}
			}
		});

		it("should handle all-zero salt", () => {
			const sender = new Uint8Array(20).fill(0x11);
			const salt = new Uint8Array(32);
			const initCodeHash = new Uint8Array(32).fill(0x22);

			const result = create2Address(sender, salt, initCodeHash);

			expect(result.length).toBe(20);
		});

		it("should handle all-ones salt", () => {
			const sender = new Uint8Array(20).fill(0x11);
			const salt = new Uint8Array(32).fill(0xff);
			const initCodeHash = new Uint8Array(32).fill(0x22);

			const result = create2Address(sender, salt, initCodeHash);

			expect(result.length).toBe(20);
		});
	});

	describe("initCodeHash variations", () => {
		it("should handle various initCodeHashes", () => {
			const sender = new Uint8Array(20).fill(0xaa);
			const salt = new Uint8Array(32).fill(0xbb);

			const testHashes = [
				new Uint8Array(32), // All zeros
				new Uint8Array(32).fill(0xff), // All ones
				hash(new Uint8Array([1, 2, 3])), // Hash of some data
			];

			const addresses = testHashes.map((initCodeHash) =>
				create2Address(sender, salt, initCodeHash),
			);

			// All should be unique
			for (let i = 0; i < addresses.length; i++) {
				for (let j = i + 1; j < addresses.length; j++) {
					expect(addresses[i]).not.toEqual(addresses[j]);
				}
			}
		});
	});

	describe("edge cases", () => {
		it("should handle all-zero inputs", () => {
			const sender = new Uint8Array(20);
			const salt = new Uint8Array(32);
			const initCodeHash = new Uint8Array(32);

			const result = create2Address(sender, salt, initCodeHash);

			expect(result.length).toBe(20);
			// Result should not be all zeros
			const isAllZeros = result.every((byte) => byte === 0);
			expect(isAllZeros).toBe(false);
		});

		it("should handle all-ones inputs", () => {
			const sender = new Uint8Array(20).fill(0xff);
			const salt = new Uint8Array(32).fill(0xff);
			const initCodeHash = new Uint8Array(32).fill(0xff);

			const result = create2Address(sender, salt, initCodeHash);

			expect(result.length).toBe(20);
		});

		it("should handle mixed patterns", () => {
			const sender = new Uint8Array(20);
			for (let i = 0; i < 20; i++) {
				sender[i] = i % 256;
			}

			const salt = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				salt[i] = (i * 7) % 256;
			}

			const initCodeHash = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				initCodeHash[i] = (i * 13) % 256;
			}

			const result = create2Address(sender, salt, initCodeHash);

			expect(result.length).toBe(20);
		});
	});

	describe("contract factory pattern", () => {
		it("should simulate factory deploying contracts with different salts", () => {
			const factory = new Uint8Array(20);
			factory[19] = 0xfa; // Factory address

			const contractBytecode = new Uint8Array([0x60, 0x80, 0x60, 0x40]); // Example bytecode
			const initCodeHash = hash(contractBytecode);

			const deployedContracts = [];
			for (let i = 0; i < 5; i++) {
				const salt = new Uint8Array(32);
				salt[31] = i;
				deployedContracts.push(create2Address(factory, salt, initCodeHash));
			}

			// All deployed contracts should have unique addresses
			const uniqueAddresses = new Set(
				deployedContracts.map((a) => a.join(",")),
			);
			expect(uniqueAddresses.size).toBe(deployedContracts.length);
		});

		it("should allow same salt with different bytecode", () => {
			const factory = new Uint8Array(20);
			factory[19] = 0xfa;

			const salt = new Uint8Array(32).fill(0x42); // Same salt

			const bytecode1 = new Uint8Array([1, 2, 3]);
			const bytecode2 = new Uint8Array([4, 5, 6]);

			const initCodeHash1 = hash(bytecode1);
			const initCodeHash2 = hash(bytecode2);

			const addr1 = create2Address(factory, salt, initCodeHash1);
			const addr2 = create2Address(factory, salt, initCodeHash2);

			// Different bytecode = different address even with same salt
			expect(addr1).not.toEqual(addr2);
		});
	});

	describe("predictable deployment", () => {
		it("should allow address prediction before deployment", () => {
			const deployer = new Uint8Array(20);
			deployer[10] = 0xde;

			const salt = new Uint8Array(32);
			salt[0] = 0x12;
			salt[31] = 0x34;

			const contractCode = new TextEncoder().encode("contract bytecode here");
			const initCodeHash = hash(contractCode);

			// Predict address before deployment
			const predictedAddress = create2Address(deployer, salt, initCodeHash);

			// Deploy would happen here...

			// Verify address remains same
			const actualAddress = create2Address(deployer, salt, initCodeHash);

			expect(actualAddress).toEqual(predictedAddress);
		});
	});

	describe("collision resistance", () => {
		it("should produce unique addresses for parameter combinations", () => {
			const addresses = new Set();

			for (let i = 0; i < 10; i++) {
				const sender = new Uint8Array(20).fill(i);

				for (let j = 0; j < 5; j++) {
					const salt = new Uint8Array(32);
					salt[31] = j;

					for (let k = 0; k < 3; k++) {
						const initCodeHash = new Uint8Array(32);
						initCodeHash[31] = k;

						const addr = create2Address(sender, salt, initCodeHash);
						const key = addr.join(",");

						// Should be unique
						expect(addresses.has(key)).toBe(false);
						addresses.add(key);
					}
				}
			}

			// Should have 10 * 5 * 3 = 150 unique addresses
			expect(addresses.size).toBe(150);
		});
	});

	describe("real-world usage patterns", () => {
		it("should compute address for minimal proxy deployment", () => {
			const factory = new Uint8Array(20);
			factory[0] = 0xca;
			factory[19] = 0xfe;

			const salt = new Uint8Array(32).fill(0x00);
			const minimalProxyBytecode = new TextEncoder().encode(
				"minimal proxy bytecode",
			);
			const initCodeHash = hash(minimalProxyBytecode);

			const result = create2Address(factory, salt, initCodeHash);

			expect(result.length).toBe(20);
		});

		it("should compute address for upgradeable proxy", () => {
			const factory = new Uint8Array(20);
			factory[0] = 0xaa;

			const salt = new Uint8Array(32);
			salt[0] = 0xbb;

			const proxyBytecode = new TextEncoder().encode(
				"upgradeable proxy bytecode",
			);
			const initCodeHash = hash(proxyBytecode);

			const result = create2Address(factory, salt, initCodeHash);

			expect(result.length).toBe(20);
		});
	});

	describe("salt as uint256", () => {
		it("should handle salt as sequential numbers", () => {
			const sender = new Uint8Array(20).fill(0x42);
			const initCodeHash = new Uint8Array(32).fill(0x99);

			const addresses = [];
			for (let i = 0; i < 10; i++) {
				const salt = new Uint8Array(32);
				salt[31] = i; // Little-endian-ish representation
				addresses.push(create2Address(sender, salt, initCodeHash));
			}

			// All unique
			const uniqueAddresses = new Set(addresses.map((a) => a.join(",")));
			expect(uniqueAddresses.size).toBe(10);
		});
	});

	describe("0xff prefix verification", () => {
		it("should use 0xff prefix in computation", () => {
			const sender = new Uint8Array(20).fill(0xaa);
			const salt = new Uint8Array(32).fill(0xbb);
			const initCodeHash = new Uint8Array(32).fill(0xcc);

			const result = create2Address(sender, salt, initCodeHash);

			// Manually verify the formula
			const data = new Uint8Array(85);
			data[0] = 0xff;
			data.set(sender, 1);
			data.set(salt, 21);
			data.set(initCodeHash, 53);

			const fullHash = hash(data);
			const expected = fullHash.slice(12);

			expect(result).toEqual(expected);
		});
	});
});
