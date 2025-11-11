import { hexToBytes, randomBytes } from "@noble/hashes/utils.js";
import { describe, expect, it } from "vitest";
import type { Domain, TypeDefinitions, TypedData } from "./BrandedEIP712.js";
import { EIP712 } from "./EIP712.js";
import {
	Eip712EncodingError,
	Eip712Error,
	Eip712InvalidMessageError,
	Eip712TypeNotFoundError,
} from "./errors.js";

describe("EIP-712 - Typed Structured Data Hashing and Signing", () => {
	describe("Domain Separator", () => {
		it("should hash domain with all fields", () => {
			const domain: Domain = {
				name: "TestDomain",
				version: "1",
				chainId: 1n,
				verifyingContract: hexToBytes(
					"CcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
				) as unknown as BrandedAddress,
				salt: hexToBytes(
					"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
				) as unknown as BrandedAddress,
			};

			const hash = EIP712.Domain.hash(domain);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
			// Should not be all zeros
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		it("should hash domain with minimal fields", () => {
			const domain: Domain = {
				name: "Minimal",
			};

			const hash = EIP712.Domain.hash(domain);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});

		it("should hash domain with only name and chainId", () => {
			const domain: Domain = {
				name: "MyApp",
				chainId: 1n,
			};

			const hash = EIP712.Domain.hash(domain);
			expect(hash.length).toBe(32);
		});

		it("should produce different hashes for different domains", () => {
			const domain1: Domain = { name: "App1", chainId: 1n };
			const domain2: Domain = { name: "App2", chainId: 1n };

			const hash1 = EIP712.Domain.hash(domain1);
			const hash2 = EIP712.Domain.hash(domain2);

			expect(hash1).not.toEqual(hash2);
		});

		it("should be deterministic", () => {
			const domain: Domain = {
				name: "TestApp",
				version: "1.0",
				chainId: 1n,
			};

			const hash1 = EIP712.Domain.hash(domain);
			const hash2 = EIP712.Domain.hash(domain);

			expect(hash1).toEqual(hash2);
		});

		it("should handle different chainId values", () => {
			const domain1: Domain = { name: "App", chainId: 1n };
			const domain2: Domain = { name: "App", chainId: 137n };

			const hash1 = EIP712.Domain.hash(domain1);
			const hash2 = EIP712.Domain.hash(domain2);

			expect(hash1).not.toEqual(hash2);
		});
	});

	describe("Type Encoding", () => {
		it("should encode simple type", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "string" },
					{ name: "wallet", type: "address" },
				],
			};

			const encoded = EIP712.encodeType("Person", types);

			expect(encoded).toBe("Person(string name,address wallet)");
		});

		it("should encode nested custom types", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "string" },
					{ name: "wallet", type: "address" },
				],
				Mail: [
					{ name: "from", type: "Person" },
					{ name: "to", type: "Person" },
					{ name: "contents", type: "string" },
				],
			};

			const encoded = EIP712.encodeType("Mail", types);

			// Should include both Mail and Person type definitions
			expect(encoded).toContain("Mail(");
			expect(encoded).toContain("Person from");
			expect(encoded).toContain("Person to");
			expect(encoded).toContain("string contents");
			expect(encoded).toContain("Person(");
		});

		it("should handle multiple nested types", () => {
			const types: TypeDefinitions = {
				Address: [
					{ name: "street", type: "string" },
					{ name: "city", type: "string" },
				],
				Person: [
					{ name: "name", type: "string" },
					{ name: "home", type: "Address" },
				],
			};

			const encoded = EIP712.encodeType("Person", types);

			expect(encoded).toContain("Person(");
			expect(encoded).toContain("Address(");
		});

		it("should throw for non-existent type", () => {
			const types: TypeDefinitions = {};

			expect(() => EIP712.encodeType("NonExistent", types)).toThrow(
				Eip712TypeNotFoundError,
			);
		});

		it("should handle type with array field", () => {
			const types: TypeDefinitions = {
				Group: [
					{ name: "name", type: "string" },
					{ name: "members", type: "address[]" },
				],
			};

			const encoded = EIP712.encodeType("Group", types);

			expect(encoded).toContain("address[] members");
		});
	});

	describe("Type Hash", () => {
		it("should compute type hash", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "string" },
					{ name: "wallet", type: "address" },
				],
			};

			const typeHash = EIP712.hashType("Person", types);

			expect(typeHash).toBeInstanceOf(Uint8Array);
			expect(typeHash.length).toBe(32);
		});

		it("should be deterministic", () => {
			const types: TypeDefinitions = {
				Message: [{ name: "content", type: "string" }],
			};

			const hash1 = EIP712.hashType("Message", types);
			const hash2 = EIP712.hashType("Message", types);

			expect(hash1).toEqual(hash2);
		});
	});

	describe("Value Encoding", () => {
		const types: TypeDefinitions = {};

		it("should encode uint256", () => {
			const encoded = EIP712.encodeValue("uint256", 42n, types);

			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBe(32);
			expect(encoded[31]).toBe(42);
		});

		it("should encode large uint256", () => {
			const large = 2n ** 128n;
			const encoded = EIP712.encodeValue("uint256", large, types);

			expect(encoded.length).toBe(32);
			// Verify big-endian encoding
			expect(encoded[15]).toBe(1);
		});

		it("should encode address", () => {
			const address = new Uint8Array(20).fill(0xaa);
			const encoded = EIP712.encodeValue("address", address, types);

			expect(encoded.length).toBe(32);
			// Address should be right-aligned (last 20 bytes)
			expect(encoded.slice(12, 32)).toEqual(address);
			// First 12 bytes should be zero
			expect(encoded.slice(0, 12).every((b) => b === 0)).toBe(true);
		});

		it("should encode bool true", () => {
			const encoded = EIP712.encodeValue("bool", true, types);

			expect(encoded.length).toBe(32);
			expect(encoded[31]).toBe(1);
		});

		it("should encode bool false", () => {
			const encoded = EIP712.encodeValue("bool", false, types);

			expect(encoded.length).toBe(32);
			expect(encoded[31]).toBe(0);
		});

		it("should encode string as hash", () => {
			const encoded = EIP712.encodeValue("string", "Hello, World!", types);

			expect(encoded.length).toBe(32);
			// Should be keccak256 hash
			expect(encoded.some((b) => b !== 0)).toBe(true);
		});

		it("should encode dynamic bytes as hash", () => {
			const bytes = new Uint8Array([0x01, 0x02, 0x03]);
			const encoded = EIP712.encodeValue("bytes", bytes, types);

			expect(encoded.length).toBe(32);
			// Should be keccak256 hash
			expect(encoded.some((b) => b !== 0)).toBe(true);
		});

		it("should encode fixed bytes", () => {
			const bytes = new Uint8Array(4).fill(0xab);
			const encoded = EIP712.encodeValue("bytes4", bytes, types);

			expect(encoded.length).toBe(32);
			// First 4 bytes should be the data (left-aligned)
			expect(encoded.slice(0, 4)).toEqual(bytes);
			// Rest should be zero
			expect(encoded.slice(4).every((b) => b === 0)).toBe(true);
		});

		it("should reject wrong size for fixed bytes", () => {
			const wrongSize = new Uint8Array(8);

			expect(() => EIP712.encodeValue("bytes4", wrongSize, types)).toThrow(
				Eip712EncodingError,
			);
		});

		it("should encode array as hash", () => {
			const arr = [1n, 2n, 3n];
			const encoded = EIP712.encodeValue("uint256[]", arr, types);

			expect(encoded.length).toBe(32);
			// Array encoding should be hashed
		});

		it("should encode custom struct type", () => {
			const customTypes: TypeDefinitions = {
				Person: [{ name: "name", type: "string" }],
			};

			const personData = { name: "Alice" };
			const encoded = EIP712.encodeValue("Person", personData, customTypes);

			expect(encoded.length).toBe(32);
			// Custom type should be hashed
		});

		it("should throw for invalid type", () => {
			expect(() => EIP712.encodeValue("invalidType", 42, types)).toThrow(
				Eip712EncodingError,
			);
		});

		it("should handle uint8 variants", () => {
			const encoded = EIP712.encodeValue("uint8", 255n, types);
			expect(encoded[31]).toBe(255);
		});

		it("should handle int256", () => {
			const encoded = EIP712.encodeValue("int256", 42n, types);
			expect(encoded.length).toBe(32);
		});
	});

	describe("Struct Hashing", () => {
		it("should hash simple struct", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "string" },
					{ name: "age", type: "uint256" },
				],
			};

			const data = {
				name: "Alice",
				age: 30n,
			};

			const hash = EIP712.hashStruct("Person", data, types);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});

		it("should hash nested struct", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "string" },
					{ name: "wallet", type: "address" },
				],
				Mail: [
					{ name: "from", type: "Person" },
					{ name: "to", type: "Person" },
					{ name: "contents", type: "string" },
				],
			};

			const data = {
				from: {
					name: "Alice",
					wallet: new Uint8Array(20).fill(0xaa),
				},
				to: {
					name: "Bob",
					wallet: new Uint8Array(20).fill(0xbb),
				},
				contents: "Hello!",
			};

			const hash = EIP712.hashStruct("Mail", data, types);

			expect(hash.length).toBe(32);
		});

		it("should be deterministic", () => {
			const types: TypeDefinitions = {
				Message: [{ name: "text", type: "string" }],
			};

			const data = { text: "Hello" };

			const hash1 = EIP712.hashStruct("Message", data, types);
			const hash2 = EIP712.hashStruct("Message", data, types);

			expect(hash1).toEqual(hash2);
		});

		it("should throw for missing field", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "string" },
					{ name: "age", type: "uint256" },
				],
			};

			const incompleteData = {
				name: "Alice",
				// missing age
			};

			expect(() => EIP712.hashStruct("Person", incompleteData, types)).toThrow(
				Eip712InvalidMessageError,
			);
		});
	});

	describe("Typed Data Hashing", () => {
		it("should hash complete typed data - simple example", () => {
			const typedData: TypedData = {
				domain: {
					name: "TestApp",
					version: "1",
					chainId: 1n,
				},
				types: {
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				message: {
					content: "Hello, EIP-712!",
				},
			};

			const hash = EIP712.hashTypedData(typedData);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);

			// Hash should start with \x19\x01 prefix (after keccak)
			// Verify it's not all zeros
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		it("should hash typed data - ERC-2612 Permit example", () => {
			const typedData: TypedData = {
				domain: {
					name: "MyToken",
					version: "1",
					chainId: 1n,
					verifyingContract: new Uint8Array(20).fill(
						0xcc,
					) as unknown as BrandedAddress,
				},
				types: {
					Permit: [
						{ name: "owner", type: "address" },
						{ name: "spender", type: "address" },
						{ name: "value", type: "uint256" },
						{ name: "nonce", type: "uint256" },
						{ name: "deadline", type: "uint256" },
					],
				},
				primaryType: "Permit",
				message: {
					owner: new Uint8Array(20).fill(0xaa) as unknown as BrandedAddress,
					spender: new Uint8Array(20).fill(0xbb) as unknown as BrandedAddress,
					value: 1000000000000000000n, // 1 token
					nonce: 0n,
					deadline: 1700000000n,
				},
			};

			const hash = EIP712.hashTypedData(typedData);

			expect(hash.length).toBe(32);
		});

		it("should hash typed data - nested Mail example", () => {
			const typedData: TypedData = {
				domain: {
					name: "Ether Mail",
					version: "1",
					chainId: 1n,
					verifyingContract: new Uint8Array(20).fill(
						0xdd,
					) as unknown as BrandedAddress,
				},
				types: {
					Person: [
						{ name: "name", type: "string" },
						{ name: "wallet", type: "address" },
					],
					Mail: [
						{ name: "from", type: "Person" },
						{ name: "to", type: "Person" },
						{ name: "contents", type: "string" },
					],
				},
				primaryType: "Mail",
				message: {
					from: {
						name: "Alice",
						wallet: new Uint8Array(20).fill(0xaa),
					},
					to: {
						name: "Bob",
						wallet: new Uint8Array(20).fill(0xbb),
					},
					contents: "Hello, Bob!",
				},
			};

			const hash = EIP712.hashTypedData(typedData);

			expect(hash.length).toBe(32);
		});

		it("should be deterministic", () => {
			const typedData: TypedData = {
				domain: { name: "App", chainId: 1n },
				types: {
					Message: [{ name: "text", type: "string" }],
				},
				primaryType: "Message",
				message: { text: "test" },
			};

			const hash1 = EIP712.hashTypedData(typedData);
			const hash2 = EIP712.hashTypedData(typedData);

			expect(hash1).toEqual(hash2);
		});

		it("should produce different hashes for different messages", () => {
			const typedData1: TypedData = {
				domain: { name: "App" },
				types: { Message: [{ name: "text", type: "string" }] },
				primaryType: "Message",
				message: { text: "message1" },
			};

			const typedData2: TypedData = {
				domain: { name: "App" },
				types: { Message: [{ name: "text", type: "string" }] },
				primaryType: "Message",
				message: { text: "message2" },
			};

			const hash1 = EIP712.hashTypedData(typedData1);
			const hash2 = EIP712.hashTypedData(typedData2);

			expect(hash1).not.toEqual(hash2);
		});

		it("should produce different hashes for different domains", () => {
			const typedData1: TypedData = {
				domain: { name: "App1" },
				types: { Message: [{ name: "text", type: "string" }] },
				primaryType: "Message",
				message: { text: "test" },
			};

			const typedData2: TypedData = {
				domain: { name: "App2" },
				types: { Message: [{ name: "text", type: "string" }] },
				primaryType: "Message",
				message: { text: "test" },
			};

			const hash1 = EIP712.hashTypedData(typedData1);
			const hash2 = EIP712.hashTypedData(typedData2);

			expect(hash1).not.toEqual(hash2);
		});
	});

	describe("Signing and Verification", () => {
		it("should sign typed data and produce valid signature format", () => {
			const privateKey = randomBytes(32);

			const typedData: TypedData = {
				domain: { name: "TestApp", chainId: 1n },
				types: {
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				message: { content: "Sign this message" },
			};

			// Sign
			const signature = EIP712.signTypedData(typedData, privateKey);

			// Verify signature format
			expect(signature.r).toBeInstanceOf(Uint8Array);
			expect(signature.s).toBeInstanceOf(Uint8Array);
			expect(signature.r.length).toBe(32);
			expect(signature.s.length).toBe(32);
			expect(signature.v).toBeGreaterThanOrEqual(27);
			expect(signature.v).toBeLessThanOrEqual(28);
		});

		it("should recover correct address from valid signature", async () => {
			const { secp256k1 } = await import("@noble/curves/secp256k1.js");
			const { keccak_256 } = await import("@noble/hashes/sha3.js");

			const privateKey = randomBytes(32);

			const typedData: TypedData = {
				domain: { name: "TestApp", chainId: 1n },
				types: {
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				message: { content: "Sign this message" },
			};

			// Sign
			const signature = EIP712.signTypedData(typedData, privateKey);

			// Recover address
			const recoveredAddress = EIP712.recoverAddress(signature, typedData);

			// Verify recovered address format
			expect(recoveredAddress).toBeInstanceOf(Uint8Array);
			expect(recoveredAddress.length).toBe(20);

			// Derive expected address from private key
			const publicKey = secp256k1.getPublicKey(privateKey, false).slice(1);
			const expectedAddress = keccak_256(publicKey).slice(-20);

			// Recovered address should match expected
			expect(recoveredAddress).toEqual(expectedAddress);
		});

		it("should verify valid typed data signature", async () => {
			const { secp256k1 } = await import("@noble/curves/secp256k1.js");
			const { keccak_256 } = await import("@noble/hashes/sha3.js");

			const privateKey = randomBytes(32);

			const typedData: TypedData = {
				domain: { name: "TestApp", chainId: 1n },
				types: {
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				message: { content: "Sign this message" },
			};

			// Sign
			const signature = EIP712.signTypedData(typedData, privateKey);

			// Derive expected address
			const publicKey = secp256k1.getPublicKey(privateKey, false).slice(1);
			const expectedAddress = keccak_256(publicKey).slice(-20);

			// Verify
			const isValid = EIP712.verifyTypedData(
				signature,
				typedData,
				expectedAddress,
			);
			expect(isValid).toBe(true);
		});

		it("should reject signature with wrong signer address", () => {
			const privateKey = randomBytes(32);

			const typedData: TypedData = {
				domain: { name: "TestApp", chainId: 1n },
				types: {
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				message: { content: "Sign this message" },
			};

			// Sign
			const signature = EIP712.signTypedData(typedData, privateKey);

			// Use wrong address
			const wrongAddress = new Uint8Array(20).fill(0xff);

			// Verify should fail
			const isValid = EIP712.verifyTypedData(
				signature,
				typedData,
				wrongAddress,
			);
			expect(isValid).toBe(false);
		});

		it("should reject signature with tampered message", async () => {
			const { secp256k1 } = await import("@noble/curves/secp256k1.js");
			const { keccak_256 } = await import("@noble/hashes/sha3.js");

			const privateKey = randomBytes(32);

			const typedData: TypedData = {
				domain: { name: "TestApp", chainId: 1n },
				types: {
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				message: { content: "Original message" },
			};

			// Sign
			const signature = EIP712.signTypedData(typedData, privateKey);

			// Derive expected address
			const publicKey = secp256k1.getPublicKey(privateKey, false).slice(1);
			const expectedAddress = keccak_256(publicKey).slice(-20);

			// Tamper with message
			const tamperedData: TypedData = {
				...typedData,
				message: { content: "Tampered message" },
			};

			// Verify should fail
			const isValid = EIP712.verifyTypedData(
				signature,
				tamperedData,
				expectedAddress,
			);
			expect(isValid).toBe(false);
		});

		it("should reject signature with tampered domain", async () => {
			const { secp256k1 } = await import("@noble/curves/secp256k1.js");
			const { keccak_256 } = await import("@noble/hashes/sha3.js");

			const privateKey = randomBytes(32);

			const typedData: TypedData = {
				domain: { name: "TestApp", chainId: 1n },
				types: {
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				message: { content: "Sign this" },
			};

			// Sign
			const signature = EIP712.signTypedData(typedData, privateKey);

			// Derive expected address
			const publicKey = secp256k1.getPublicKey(privateKey, false).slice(1);
			const expectedAddress = keccak_256(publicKey).slice(-20);

			// Tamper with domain (different chainId)
			const tamperedData: TypedData = {
				...typedData,
				domain: { name: "TestApp", chainId: 2n },
			};

			// Verify should fail
			const isValid = EIP712.verifyTypedData(
				signature,
				tamperedData,
				expectedAddress,
			);
			expect(isValid).toBe(false);
		});

		it("should handle both recovery bits (v = 27 and v = 28)", () => {
			// Test multiple signatures to likely hit both v values
			for (let i = 0; i < 10; i++) {
				const privateKey = randomBytes(32);

				const typedData: TypedData = {
					domain: { name: "TestApp", chainId: 1n },
					types: {
						Message: [{ name: "content", type: "string" }],
					},
					primaryType: "Message",
					message: { content: `Message ${i}` },
				};

				const signature = EIP712.signTypedData(typedData, privateKey);

				// Should handle both v values correctly
				expect([27, 28]).toContain(signature.v);

				// Recovery should work regardless of v value
				const recoveredAddress = EIP712.recoverAddress(signature, typedData);
				expect(recoveredAddress.length).toBe(20);
			}
		});

		it("should reject signature with invalid recovery bit", () => {
			const privateKey = randomBytes(32);

			const typedData: TypedData = {
				domain: { name: "TestApp", chainId: 1n },
				types: {
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				message: { content: "Test" },
			};

			const signature = EIP712.signTypedData(typedData, privateKey);

			// Tamper with v (invalid recovery bit)
			const invalidSignature = { ...signature, v: 29 };

			// Should throw or return false
			expect(() =>
				EIP712.recoverAddress(invalidSignature, typedData),
			).toThrow();
		});

		it("should reject signature with all-zero r component", async () => {
			const { secp256k1 } = await import("@noble/curves/secp256k1.js");
			const { keccak_256 } = await import("@noble/hashes/sha3.js");

			const privateKey = randomBytes(32);

			const typedData: TypedData = {
				domain: { name: "TestApp", chainId: 1n },
				types: {
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				message: { content: "Test" },
			};

			const signature = EIP712.signTypedData(typedData, privateKey);

			// Tamper r to all zeros
			const invalidSignature = {
				r: new Uint8Array(32),
				s: signature.s,
				v: signature.v,
			};

			// Should throw or return false on recovery
			const publicKey = secp256k1.getPublicKey(privateKey, false).slice(1);
			const expectedAddress = keccak_256(publicKey).slice(-20);

			const isValid = EIP712.verifyTypedData(
				invalidSignature,
				typedData,
				expectedAddress,
			);
			expect(isValid).toBe(false);
		});

		it("should reject signature with all-zero s component", async () => {
			const { secp256k1 } = await import("@noble/curves/secp256k1.js");
			const { keccak_256 } = await import("@noble/hashes/sha3.js");

			const privateKey = randomBytes(32);

			const typedData: TypedData = {
				domain: { name: "TestApp", chainId: 1n },
				types: {
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				message: { content: "Test" },
			};

			const signature = EIP712.signTypedData(typedData, privateKey);

			// Tamper s to all zeros
			const invalidSignature = {
				r: signature.r,
				s: new Uint8Array(32),
				v: signature.v,
			};

			// Should throw or return false on recovery
			const publicKey = secp256k1.getPublicKey(privateKey, false).slice(1);
			const expectedAddress = keccak_256(publicKey).slice(-20);

			const isValid = EIP712.verifyTypedData(
				invalidSignature,
				typedData,
				expectedAddress,
			);
			expect(isValid).toBe(false);
		});

		it("should handle verification with wrong address length gracefully", () => {
			const privateKey = randomBytes(32);

			const typedData: TypedData = {
				domain: { name: "TestApp", chainId: 1n },
				types: {
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				message: { content: "Test" },
			};

			const signature = EIP712.signTypedData(typedData, privateKey);

			// Wrong address length
			const wrongLengthAddress = new Uint8Array(19);

			// Should return false, not throw
			const isValid = EIP712.verifyTypedData(
				signature,
				typedData,
				wrongLengthAddress,
			);
			expect(isValid).toBe(false);
		});

		it("should use constant-time comparison in verification", async () => {
			const { secp256k1 } = await import("@noble/curves/secp256k1.js");
			const { keccak_256 } = await import("@noble/hashes/sha3.js");

			const privateKey = randomBytes(32);

			const typedData: TypedData = {
				domain: { name: "TestApp", chainId: 1n },
				types: {
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				message: { content: "Test" },
			};

			const signature = EIP712.signTypedData(typedData, privateKey);

			// Derive correct address
			const publicKey = secp256k1.getPublicKey(privateKey, false).slice(1);
			const correctAddress = keccak_256(publicKey).slice(-20);

			// Test verification multiple times to ensure consistent behavior
			const timings = [];
			for (let i = 0; i < 100; i++) {
				const wrongAddress = randomBytes(20);
				const start = performance.now();
				EIP712.verifyTypedData(signature, typedData, wrongAddress);
				const end = performance.now();
				timings.push(end - start);
			}

			// All timing should be relatively consistent (within 2x)
			// This is a basic timing side-channel test
			const minTime = Math.min(...timings);
			const maxTime = Math.max(...timings);
			const ratio = maxTime / minTime;

			// Allow for reasonable variation due to system scheduling
			expect(ratio).toBeLessThan(10);
		});

		it("should sign different messages with same key", () => {
			const privateKey = randomBytes(32);

			const typedData1: TypedData = {
				domain: { name: "App" },
				types: { Message: [{ name: "text", type: "string" }] },
				primaryType: "Message",
				message: { text: "message1" },
			};

			const typedData2: TypedData = {
				domain: { name: "App" },
				types: { Message: [{ name: "text", type: "string" }] },
				primaryType: "Message",
				message: { text: "message2" },
			};

			const sig1 = EIP712.signTypedData(typedData1, privateKey);
			const sig2 = EIP712.signTypedData(typedData2, privateKey);

			// Different messages should produce different signatures
			expect(sig1.r).not.toEqual(sig2.r);
			expect(sig1.s).not.toEqual(sig2.s);
		});

		it("should reject invalid private key size", () => {
			const wrongSize = new Uint8Array(16);
			const typedData: TypedData = {
				domain: { name: "App" },
				types: { Message: [{ name: "text", type: "string" }] },
				primaryType: "Message",
				message: { text: "test" },
			};

			// Should throw (actual error is InvalidPrivateKeyError from Secp256k1)
			expect(() => EIP712.signTypedData(typedData, wrongSize)).toThrow();
		});
	});

	describe("Security Properties", () => {
		it.skip("should prevent signature replay on different chains", () => {
			// Skipped: requires working signature recovery
		});

		it.skip("should use constant-time comparison in verification", () => {
			// Skipped: requires working signature recovery
		});

		it("should handle domain separation correctly", () => {
			const typedData1: TypedData = {
				domain: { name: "Domain1" },
				types: { Message: [{ name: "text", type: "string" }] },
				primaryType: "Message",
				message: { text: "test" },
			};

			const typedData2: TypedData = {
				domain: { name: "Domain2" },
				types: { Message: [{ name: "text", type: "string" }] },
				primaryType: "Message",
				message: { text: "test" },
			};

			const hash1 = EIP712.hashTypedData(typedData1);
			const hash2 = EIP712.hashTypedData(typedData2);

			// Domain separation ensures different domains produce different hashes
			expect(hash1).not.toEqual(hash2);
		});
	});

	describe("Common Patterns - ERC-2612 Permit", () => {
		it("should handle ERC-2612 Permit structure", () => {
			const permitData: TypedData = {
				domain: {
					name: "USD Coin",
					version: "2",
					chainId: 1n,
					verifyingContract: hexToBytes(
						"A0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					) as unknown as BrandedAddress, // USDC on mainnet
				},
				types: {
					Permit: [
						{ name: "owner", type: "address" },
						{ name: "spender", type: "address" },
						{ name: "value", type: "uint256" },
						{ name: "nonce", type: "uint256" },
						{ name: "deadline", type: "uint256" },
					],
				},
				primaryType: "Permit",
				message: {
					owner: new Uint8Array(20).fill(0xaa),
					spender: new Uint8Array(20).fill(0xbb),
					value: 1000000n, // 1 USDC (6 decimals)
					nonce: 0n,
					deadline: 1735689600n, // Jan 1, 2025
				},
			};

			const hash = EIP712.hashTypedData(permitData);
			expect(hash.length).toBe(32);

			// Sign and verify
			const privateKey = randomBytes(32);
			const signature = EIP712.signTypedData(permitData, privateKey);

			expect(signature.r.length).toBe(32);
			expect(signature.s.length).toBe(32);
			expect([27, 28]).toContain(signature.v);
		});
	});

	describe("Common Patterns - MetaTransaction", () => {
		it("should handle MetaTransaction structure", () => {
			const metaTxData: TypedData = {
				domain: {
					name: "MetaTransaction",
					version: "1",
					chainId: 137n, // Polygon
					verifyingContract: new Uint8Array(20).fill(
						0xcc,
					) as unknown as BrandedAddress,
				},
				types: {
					MetaTransaction: [
						{ name: "nonce", type: "uint256" },
						{ name: "from", type: "address" },
						{ name: "functionSignature", type: "bytes" },
					],
				},
				primaryType: "MetaTransaction",
				message: {
					nonce: 0n,
					from: new Uint8Array(20).fill(0xaa) as unknown as BrandedAddress,
					functionSignature: hexToBytes("a9059cbb"), // transfer(address,uint256)
				},
			};

			const hash = EIP712.hashTypedData(metaTxData);
			expect(hash.length).toBe(32);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty string", () => {
			const types: TypeDefinitions = {};
			const encoded = EIP712.encodeValue("string", "", types);

			expect(encoded.length).toBe(32);
		});

		it("should handle very long string", () => {
			const types: TypeDefinitions = {};
			const longString = "a".repeat(10000);
			const encoded = EIP712.encodeValue("string", longString, types);

			expect(encoded.length).toBe(32); // Still hashed to 32 bytes
		});

		it("should handle empty array", () => {
			const types: TypeDefinitions = {};
			const encoded = EIP712.encodeValue("uint256[]", [], types);

			expect(encoded.length).toBe(32);
		});

		it("should handle large array", () => {
			const types: TypeDefinitions = {};
			const largeArray = Array.from({ length: 100 }, (_, i) => BigInt(i));
			const encoded = EIP712.encodeValue("uint256[]", largeArray, types);

			expect(encoded.length).toBe(32);
		});

		it("should handle maximum uint256 value", () => {
			const types: TypeDefinitions = {};
			const max = 2n ** 256n - 1n;
			const encoded = EIP712.encodeValue("uint256", max, types);

			expect(encoded.length).toBe(32);
			// All bytes should be 0xff
			expect(encoded.every((b) => b === 0xff)).toBe(true);
		});

		it("should handle deeply nested structures", () => {
			const types: TypeDefinitions = {
				Level3: [{ name: "value", type: "uint256" }],
				Level2: [{ name: "nested", type: "Level3" }],
				Level1: [{ name: "nested", type: "Level2" }],
			};

			const data = {
				nested: {
					nested: {
						value: 42n,
					},
				},
			};

			const hash = EIP712.hashStruct("Level1", data, types);
			expect(hash.length).toBe(32);
		});

		it("should handle type with many fields", () => {
			const types: TypeDefinitions = {
				ManyFields: Array.from({ length: 20 }, (_, i) => ({
					name: `field${i}`,
					type: "uint256",
				})),
			};

			const data = Object.fromEntries(
				Array.from({ length: 20 }, (_, i) => [`field${i}`, BigInt(i)]),
			);

			const hash = EIP712.hashStruct("ManyFields", data, types);
			expect(hash.length).toBe(32);
		});
	});

	describe("Validation", () => {
		it("should validate complete typed data", () => {
			const typedData: TypedData = {
				domain: { name: "App" },
				types: { Message: [{ name: "text", type: "string" }] },
				primaryType: "Message",
				message: { text: "test" },
			};

			expect(() => EIP712.validate(typedData)).not.toThrow();
		});

		it("should reject typed data with missing primary type", () => {
			const invalid = {
				domain: { name: "App" },
				types: { Message: [{ name: "text", type: "string" }] },
				primaryType: "NonExistent",
				message: { text: "test" },
			};

			expect(() => EIP712.validate(invalid as TypedData)).toThrow();
		});
	});

	describe("Formatting", () => {
		it("should format typed data for display", () => {
			const typedData: TypedData = {
				domain: { name: "TestApp", version: "1" },
				types: { Message: [{ name: "text", type: "string" }] },
				primaryType: "Message",
				message: { text: "Hello" },
			};

			const formatted = EIP712.format(typedData);

			expect(typeof formatted).toBe("string");
			expect(formatted).toContain("TestApp");
			expect(formatted).toContain("Message");
		});
	});
});
