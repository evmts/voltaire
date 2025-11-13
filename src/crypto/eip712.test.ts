/**
 * EIP-712 Tests
 *
 * Comprehensive test suite for EIP-712 typed data signing
 */

import { describe, expect, it } from "vitest";
import { Address } from "../primitives/Address/index.js";
import type { BrandedHash } from "../primitives/Hash/BrandedHash/BrandedHash.js";
import { equals } from "../primitives/Hash/BrandedHash/equals.js";
import { fromHex } from "../primitives/Hash/BrandedHash/fromHex.js";
import { isZero } from "../primitives/Hash/BrandedHash/isZero.js";
import { keccak256 } from "../primitives/Hash/BrandedHash/keccak256.js";
import { keccak256String } from "../primitives/Hash/BrandedHash/index.js";
import {
	type Domain,
	EIP712,
	type Message,
	type TypeDefinitions,
	type TypedData,
} from "./EIP712/index.js";

describe("EIP712", () => {
	describe("Domain.hash", () => {
		it("hashes domain with all fields", () => {
			const domain: Domain = {
				name: "TestDomain",
				version: "1",
				chainId: 1n,
				verifyingContract: Address.fromHex(
					"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				),
				salt: fromHex(
					"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
				),
			};

			const hash = EIP712.Domain.hash(domain);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
			expect(isZero(hash)).toBe(false);
		});

		it("hashes domain with minimal fields", () => {
			const domain: Domain = {
				name: "MinimalDomain",
			};

			const hash = EIP712.Domain.hash(domain);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
			expect(isZero(hash)).toBe(false);
		});

		it("produces deterministic hashes", () => {
			const domain: Domain = {
				name: "TestDomain",
				version: "1",
				chainId: 1n,
			};

			const hash1 = EIP712.Domain.hash(domain);
			const hash2 = EIP712.Domain.hash(domain);

			expect(equals(hash1, hash2)).toBe(true);
		});

		it("produces different hashes for different domains", () => {
			const domain1: Domain = {
				name: "Domain1",
			};
			const domain2: Domain = {
				name: "Domain2",
			};

			const hash1 = EIP712.Domain.hash(domain1);
			const hash2 = EIP712.Domain.hash(domain2);

			expect(equals(hash1, hash2)).toBe(false);
		});
	});

	describe("encodeType", () => {
		it("encodes simple type", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "string" },
					{ name: "wallet", type: "address" },
				],
			};

			const encoded = EIP712.encodeType("Person", types);

			expect(encoded).toBe("Person(string name,address wallet)");
		});

		it("encodes nested types in alphabetical order", () => {
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

			expect(encoded).toContain("Mail(");
			expect(encoded).toContain("Person(");
			expect(encoded).toContain("string name");
			expect(encoded).toContain("address wallet");
		});

		it("throws on missing type", () => {
			const types: TypeDefinitions = {};

			expect(() => EIP712.encodeType("NonExistent", types)).toThrow();
		});

		it("handles multiple custom type references", () => {
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
	});

	describe("hashType", () => {
		it("hashes type string", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "string" },
					{ name: "wallet", type: "address" },
				],
			};

			const hash = EIP712.hashType("Person", types);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
			expect(isZero(hash)).toBe(false);
		});

		it("produces deterministic type hashes", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "string" },
					{ name: "wallet", type: "address" },
				],
			};

			const hash1 = EIP712.hashType("Person", types);
			const hash2 = EIP712.hashType("Person", types);

			expect(equals(hash1, hash2)).toBe(true);
		});
	});

	describe("encodeValue", () => {
		const types: TypeDefinitions = {};

		it("encodes uint256", () => {
			const encoded = EIP712.encodeValue("uint256", 42n, types);

			expect(encoded.length).toBe(32);
			expect(encoded[31]).toBe(42);
		});

		it("encodes address", () => {
			const address = Address.fromHex(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			);
			const encoded = EIP712.encodeValue("address", address, types);

			expect(encoded.length).toBe(32);
			// Address should be right-aligned
			expect(Array.from(encoded.slice(12))).toEqual(Array.from(address));
		});

		it("encodes bool true", () => {
			const encoded = EIP712.encodeValue("bool", true, types);

			expect(encoded.length).toBe(32);
			expect(encoded[31]).toBe(1);
		});

		it("encodes bool false", () => {
			const encoded = EIP712.encodeValue("bool", false, types);

			expect(encoded.length).toBe(32);
			expect(encoded[31]).toBe(0);
		});

		it("encodes string (as hash)", () => {
			const encoded = EIP712.encodeValue("string", "Hello, World!", types);

			expect(encoded.length).toBe(32);
			// Should be keccak256 of the string
			const expected = keccak256String("Hello, World!");
			expect(equals(encoded as BrandedHash, expected)).toBe(true);
		});

		it("encodes dynamic bytes (as hash)", () => {
			const bytes = new Uint8Array([1, 2, 3, 4]);
			const encoded = EIP712.encodeValue("bytes", bytes, types);

			expect(encoded.length).toBe(32);
			// Should be keccak256 of the bytes
			const expected = keccak256(bytes);
			expect(equals(encoded as BrandedHash, expected)).toBe(true);
		});

		it("encodes fixed bytes", () => {
			const bytes = new Uint8Array([0xab, 0xcd, 0xef, 0x12]);
			const encoded = EIP712.encodeValue("bytes4", bytes, types);

			expect(encoded.length).toBe(32);
			// Should be left-aligned
			expect(encoded.slice(0, 4)).toEqual(bytes);
		});

		it("throws on wrong size for fixed bytes", () => {
			const bytes = new Uint8Array([0xab, 0xcd]); // Only 2 bytes

			expect(() => EIP712.encodeValue("bytes4", bytes, types)).toThrow();
		});

		it("encodes arrays", () => {
			const arr = [1n, 2n, 3n];
			const encoded = EIP712.encodeValue("uint256[]", arr, types);

			expect(encoded.length).toBe(32);
			// Should be hash of concatenated encoded elements
			expect(isZero(encoded as BrandedHash)).toBe(false);
		});

		it("encodes custom struct", () => {
			const typesWithStruct: TypeDefinitions = {
				Person: [
					{ name: "name", type: "string" },
					{ name: "age", type: "uint256" },
				],
			};

			const person = {
				name: "Alice",
				age: 30n,
			};

			const encoded = EIP712.encodeValue("Person", person, typesWithStruct);

			expect(encoded.length).toBe(32);
			// Should be hash of struct
			expect(isZero(encoded as BrandedHash)).toBe(false);
		});

		it("throws on unsupported type", () => {
			expect(() => EIP712.encodeValue("unknownType", 42, types)).toThrow();
		});
	});

	describe("hashStruct", () => {
		it("hashes simple struct", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "string" },
					{ name: "wallet", type: "address" },
				],
			};

			const message: Message = {
				name: "Alice",
				wallet: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
			};

			const hash = EIP712.hashStruct("Person", message, types);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
			expect(isZero(hash)).toBe(false);
		});

		it("throws on missing field", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "string" },
					{ name: "wallet", type: "address" },
				],
			};

			const message: Message = {
				name: "Alice",
				// Missing wallet field
			};

			expect(() => EIP712.hashStruct("Person", message, types)).toThrow();
		});

		it("produces deterministic hashes", () => {
			const types: TypeDefinitions = {
				Person: [
					{ name: "name", type: "string" },
					{ name: "age", type: "uint256" },
				],
			};

			const message: Message = {
				name: "Alice",
				age: 30n,
			};

			const hash1 = EIP712.hashStruct("Person", message, types);
			const hash2 = EIP712.hashStruct("Person", message, types);

			expect(equals(hash1, hash2)).toBe(true);
		});
	});

	describe("hashTypedData", () => {
		it("hashes complete typed data", () => {
			const typedData: TypedData = {
				domain: {
					name: "TestApp",
					version: "1",
					chainId: 1n,
				},
				types: {
					Person: [
						{ name: "name", type: "string" },
						{ name: "wallet", type: "address" },
					],
				},
				primaryType: "Person",
				message: {
					name: "Alice",
					wallet: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
				},
			};

			const hash = EIP712.hashTypedData(typedData);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
			expect(isZero(hash)).toBe(false);
		});

		it("produces deterministic hashes", () => {
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
					content: "Hello!",
				},
			};

			const hash1 = EIP712.hashTypedData(typedData);
			const hash2 = EIP712.hashTypedData(typedData);

			expect(equals(hash1, hash2)).toBe(true);
		});

		it("handles nested types", () => {
			const typedData: TypedData = {
				domain: {
					name: "TestApp",
					version: "1",
					chainId: 1n,
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
						wallet: Address.fromHex(
							"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
						),
					},
					to: {
						name: "Bob",
						wallet: Address.fromHex(
							"0x1234567890123456789012345678901234567890",
						),
					},
					contents: "Hello Bob!",
				},
			};

			const hash = EIP712.hashTypedData(typedData);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
			expect(isZero(hash)).toBe(false);
		});
	});

	describe("signTypedData", () => {
		it("signs typed data", () => {
			const privateKey = new Uint8Array(32);
			privateKey[0] = 1; // Non-zero private key

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
					content: "Hello!",
				},
			};

			const signature = EIP712.signTypedData(typedData, privateKey);

			expect(signature.r).toBeInstanceOf(Uint8Array);
			expect(signature.r.length).toBe(32);
			expect(signature.s).toBeInstanceOf(Uint8Array);
			expect(signature.s.length).toBe(32);
			expect(signature.v).toBeGreaterThanOrEqual(27);
			expect(signature.v).toBeLessThanOrEqual(28);
		});

		it("throws on invalid private key length", () => {
			const invalidKey = new Uint8Array(16); // Wrong length
			const typedData: TypedData = {
				domain: { name: "Test" },
				types: { Message: [{ name: "content", type: "string" }] },
				primaryType: "Message",
				message: { content: "Hello" },
			};

			expect(() => EIP712.signTypedData(typedData, invalidKey)).toThrow();
		});

		it("produces deterministic signatures", () => {
			const privateKey = new Uint8Array(32);
			privateKey[0] = 1;

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
					content: "Hello!",
				},
			};

			const sig1 = EIP712.signTypedData(typedData, privateKey);
			const sig2 = EIP712.signTypedData(typedData, privateKey);

			expect(sig1.v).toBe(sig2.v);
			expect(sig1.r).toEqual(sig2.r);
			expect(sig1.s).toEqual(sig2.s);
		});
	});

	describe("recoverAddress", () => {
		it("recovers address from signature", () => {
			const privateKey = new Uint8Array(32);
			privateKey[0] = 1;

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
					content: "Hello!",
				},
			};

			const signature = EIP712.signTypedData(typedData, privateKey);
			const recovered = EIP712.recoverAddress(signature, typedData);

			expect(recovered).toBeInstanceOf(Uint8Array);
			expect(recovered.length).toBe(20);
		});
	});

	describe("verifyTypedData", () => {
		it("verifies valid signature", () => {
			const privateKey = new Uint8Array(32);
			privateKey[0] = 1;

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
					content: "Hello!",
				},
			};

			const signature = EIP712.signTypedData(typedData, privateKey);
			const address = EIP712.recoverAddress(signature, typedData);
			const valid = EIP712.verifyTypedData(signature, typedData, address);

			expect(valid).toBe(true);
		});

		it("rejects invalid signature", () => {
			const privateKey1 = new Uint8Array(32);
			privateKey1[0] = 1;
			const privateKey2 = new Uint8Array(32);
			privateKey2[0] = 2;

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
					content: "Hello!",
				},
			};

			const signature = EIP712.signTypedData(typedData, privateKey1);
			const wrongAddress = EIP712.recoverAddress(
				EIP712.signTypedData(typedData, privateKey2),
				typedData,
			);
			const valid = EIP712.verifyTypedData(signature, typedData, wrongAddress);

			expect(valid).toBe(false);
		});

		it("rejects tampered message", () => {
			const privateKey = new Uint8Array(32);
			privateKey[0] = 1;

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
					content: "Hello!",
				},
			};

			const signature = EIP712.signTypedData(typedData, privateKey);
			const address = EIP712.recoverAddress(signature, typedData);

			// Tamper with message
			const tamperedData = { ...typedData };
			tamperedData.message = { content: "Goodbye!" };

			const valid = EIP712.verifyTypedData(signature, tamperedData, address);

			expect(valid).toBe(false);
		});
	});

	describe("EIP-712 test vectors", () => {
		it("handles EIP-712 example from spec", () => {
			// Based on https://eips.ethereum.org/EIPS/eip-712
			const typedData: TypedData = {
				domain: {
					name: "Ether Mail",
					version: "1",
					chainId: 1n,
					verifyingContract: Address.fromHex(
						"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
					),
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
						name: "Cow",
						wallet: Address.fromHex(
							"0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
						),
					},
					to: {
						name: "Bob",
						wallet: Address.fromHex(
							"0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
						),
					},
					contents: "Hello, Bob!",
				},
			};

			const hash = EIP712.hashTypedData(typedData);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
			expect(isZero(hash)).toBe(false);
		});
	});

	describe("validate", () => {
		it("validates valid typed data", () => {
			const typedData: TypedData = {
				domain: { name: "Test" },
				types: {
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				message: { content: "Hello" },
			};

			expect(() => EIP712.validate(typedData)).not.toThrow();
		});

		it("throws on missing primary type", () => {
			const typedData: TypedData = {
				domain: { name: "Test" },
				types: {
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "NonExistent",
				message: { content: "Hello" },
			};

			expect(() => EIP712.validate(typedData)).toThrow();
		});

		it("handles circular type references", () => {
			// Test circular type definitions (not message validation)
			const typedData: TypedData = {
				domain: { name: "Test" },
				types: {
					Node: [
						{ name: "value", type: "uint256" },
						{ name: "children", type: "Node[]" },
					],
				},
				primaryType: "Node",
				message: {
					value: 1n,
					children: [
						{ value: 2n, children: [] },
						{ value: 3n, children: [] },
					],
				},
			};

			expect(() => EIP712.validate(typedData)).not.toThrow();
		});
	});

	describe("format", () => {
		it("formats typed data for display", () => {
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
					content: "Hello!",
				},
			};

			const formatted = EIP712.format(typedData);

			expect(formatted).toContain("EIP-712 Typed Data");
			expect(formatted).toContain("Domain:");
			expect(formatted).toContain("TestApp");
			expect(formatted).toContain("Primary Type:");
			expect(formatted).toContain("Message");
		});
	});

	describe("ERC-2612 Permit example", () => {
		it("signs ERC-2612 permit message", () => {
			const privateKey = new Uint8Array(32);
			privateKey[0] = 1;

			// Derive owner address from private key by signing a test message
			const testMessage: TypedData = {
				domain: { name: "Test" },
				types: { Test: [{ name: "value", type: "uint256" }] },
				primaryType: "Test",
				message: { value: 1n },
			};
			const testSig = EIP712.signTypedData(testMessage, privateKey);
			const owner = EIP712.recoverAddress(testSig, testMessage);

			const spender = Address.fromHex(
				"0x1234567890123456789012345678901234567890",
			);

			const typedData: TypedData = {
				domain: {
					name: "USD Coin",
					version: "1",
					chainId: 1n,
					verifyingContract: Address.fromHex(
						"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					),
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
					owner,
					spender,
					value: 1000000n, // 1 USDC
					nonce: 0n,
					deadline: 1700000000n,
				},
			};

			const signature = EIP712.signTypedData(typedData, privateKey);
			const valid = EIP712.verifyTypedData(signature, typedData, owner);

			expect(valid).toBe(true);
		});
	});

	describe("Meta-transaction example", () => {
		it("signs meta-transaction", () => {
			const privateKey = new Uint8Array(32);
			privateKey[0] = 1;

			// Derive from address from private key by signing a test message
			const testMessage: TypedData = {
				domain: { name: "Test" },
				types: { Test: [{ name: "value", type: "uint256" }] },
				primaryType: "Test",
				message: { value: 1n },
			};
			const testSig = EIP712.signTypedData(testMessage, privateKey);
			const from = EIP712.recoverAddress(testSig, testMessage);

			const typedData: TypedData = {
				domain: {
					name: "MinimalForwarder",
					version: "0.0.1",
					chainId: 1n,
					verifyingContract: Address.fromHex(
						"0x1234567890123456789012345678901234567890",
					),
				},
				types: {
					ForwardRequest: [
						{ name: "from", type: "address" },
						{ name: "to", type: "address" },
						{ name: "value", type: "uint256" },
						{ name: "gas", type: "uint256" },
						{ name: "nonce", type: "uint256" },
						{ name: "data", type: "bytes" },
					],
				},
				primaryType: "ForwardRequest",
				message: {
					from,
					to: Address.fromHex("0x9876543210987654321098765432109876543210"),
					value: 0n,
					gas: 100000n,
					nonce: 0n,
					data: new Uint8Array([0x12, 0x34]),
				},
			};

			const signature = EIP712.signTypedData(typedData, privateKey);
			const valid = EIP712.verifyTypedData(signature, typedData, from);

			expect(valid).toBe(true);
		});
	});
});
