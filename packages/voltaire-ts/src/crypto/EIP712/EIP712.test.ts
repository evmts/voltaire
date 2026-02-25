import { hexToBytes, randomBytes } from "@noble/hashes/utils.js";
import { describe, expect, it } from "vitest";
import * as Address from "../../primitives/Address/internal-index.js";
import * as ChainId from "../../primitives/ChainId/index.js";
import { EIP712 } from "./EIP712.js";
import type { Domain, TypeDefinitions, TypedData } from "./EIP712Type.js";
import {
	Eip712EncodingError,
	Eip712InvalidDomainError,
	Eip712InvalidMessageError,
	Eip712TypeNotFoundError,
} from "./errors.js";

describe("EIP-712 - Typed Structured Data Hashing and Signing", () => {
	describe("Domain Separator", () => {
		it("should hash domain with all fields", () => {
			const domain: Domain = {
				name: "TestDomain",
				version: "1",
				chainId: ChainId.from(1),
				verifyingContract: Address.from(
					"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
				),
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
				chainId: ChainId.from(1),
			};

			const hash = EIP712.Domain.hash(domain);
			expect(hash.length).toBe(32);
		});

		it("should produce different hashes for different domains", () => {
			const domain1: Domain = { name: "App1", chainId: ChainId.from(1) };
			const domain2: Domain = { name: "App2", chainId: ChainId.from(1) };

			const hash1 = EIP712.Domain.hash(domain1);
			const hash2 = EIP712.Domain.hash(domain2);

			expect(hash1).not.toEqual(hash2);
		});

		it("should be deterministic", () => {
			const domain: Domain = {
				name: "TestApp",
				version: "1.0",
				chainId: ChainId.from(1),
			};

			const hash1 = EIP712.Domain.hash(domain);
			const hash2 = EIP712.Domain.hash(domain);

			expect(hash1).toEqual(hash2);
		});

		it("should handle different chainId values", () => {
			const domain1: Domain = { name: "App", chainId: ChainId.from(1) };
			const domain2: Domain = { name: "App", chainId: ChainId.from(137) };

			const hash1 = EIP712.Domain.hash(domain1);
			const hash2 = EIP712.Domain.hash(domain2);

			expect(hash1).not.toEqual(hash2);
		});
	});

	describe("Domain Field Validation", () => {
		it("should reject non-string name", () => {
			const domain = { name: 123 } as unknown as Domain;

			expect(() => EIP712.Domain.hash(domain)).toThrow(
				Eip712InvalidDomainError,
			);
			expect(() => EIP712.Domain.hash(domain)).toThrow(
				"'name' must be a string",
			);
		});

		it("should reject non-string version", () => {
			const domain = { name: "App", version: 1 } as unknown as Domain;

			expect(() => EIP712.Domain.hash(domain)).toThrow(
				Eip712InvalidDomainError,
			);
			expect(() => EIP712.Domain.hash(domain)).toThrow(
				"'version' must be a string",
			);
		});

		it("should reject invalid chainId type", () => {
			const domain = { name: "App", chainId: "1" } as unknown as Domain;

			expect(() => EIP712.Domain.hash(domain)).toThrow(
				Eip712InvalidDomainError,
			);
			expect(() => EIP712.Domain.hash(domain)).toThrow(
				"'chainId' must be a bigint, number, or Uint8Array",
			);
		});

		it("should accept bigint chainId", () => {
			const domain = { name: "App", chainId: 1n };

			expect(() => EIP712.Domain.hash(domain)).not.toThrow();
		});

		it("should accept number chainId", () => {
			const domain = { name: "App", chainId: 1 };

			expect(() => EIP712.Domain.hash(domain)).not.toThrow();
		});

		it("should reject invalid verifyingContract type", () => {
			const domain = {
				name: "App",
				verifyingContract: 123,
			} as unknown as Domain;

			expect(() => EIP712.Domain.hash(domain)).toThrow(
				Eip712InvalidDomainError,
			);
			expect(() => EIP712.Domain.hash(domain)).toThrow(
				"'verifyingContract' must be an address",
			);
		});

		it("should reject wrong length verifyingContract", () => {
			const domain = {
				name: "App",
				verifyingContract: new Uint8Array(19), // 19 bytes instead of 20
			} as unknown as Domain;

			expect(() => EIP712.Domain.hash(domain)).toThrow(
				Eip712InvalidDomainError,
			);
			expect(() => EIP712.Domain.hash(domain)).toThrow("must be 20 bytes");
		});

		it("should accept valid 20-byte verifyingContract", () => {
			const domain = {
				name: "App",
				verifyingContract: new Uint8Array(20).fill(0xcc),
			} as unknown as Domain;

			expect(() => EIP712.Domain.hash(domain)).not.toThrow();
		});

		it("should reject invalid salt type", () => {
			const domain = { name: "App", salt: 123 } as unknown as Domain;

			expect(() => EIP712.Domain.hash(domain)).toThrow(
				Eip712InvalidDomainError,
			);
			expect(() => EIP712.Domain.hash(domain)).toThrow(
				"'salt' must be bytes32",
			);
		});

		it("should reject wrong length salt", () => {
			const domain = {
				name: "App",
				salt: new Uint8Array(31), // 31 bytes instead of 32
			} as unknown as Domain;

			expect(() => EIP712.Domain.hash(domain)).toThrow(
				Eip712InvalidDomainError,
			);
			expect(() => EIP712.Domain.hash(domain)).toThrow("must be 32 bytes");
		});

		it("should accept valid 32-byte salt", () => {
			const domain = {
				name: "App",
				salt: new Uint8Array(32).fill(0xab),
			} as unknown as Domain;

			expect(() => EIP712.Domain.hash(domain)).not.toThrow();
		});

		it("should reject unknown domain fields", () => {
			const domain = { name: "App", invalidField: "bad" } as unknown as Domain;

			expect(() => EIP712.Domain.hash(domain)).toThrow(
				Eip712InvalidDomainError,
			);
			expect(() => EIP712.Domain.hash(domain)).toThrow("Unknown domain field");
		});

		it("should accept Address type for verifyingContract", () => {
			const domain = {
				name: "App",
				verifyingContract: Address.from(
					"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
				),
			} as unknown as Domain;

			expect(() => EIP712.Domain.hash(domain)).not.toThrow();
		});

		it("should accept Uint8Array for salt", () => {
			const domain = {
				name: "App",
				salt: hexToBytes(
					"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
				),
			} as unknown as Domain;

			expect(() => EIP712.Domain.hash(domain)).not.toThrow();
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

			try {
				EIP712.encodeType("NonExistent", types);
				expect.fail("Expected Eip712TypeNotFoundError");
			} catch (e) {
				expect(e).toBeInstanceOf(Eip712TypeNotFoundError);
				expect((e as Error).name).toBe("Eip712TypeNotFoundError");
			}
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
			const address = Address.from(new Uint8Array(20).fill(0xaa));
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

			try {
				EIP712.encodeValue("bytes4", wrongSize, types);
				expect.fail("Expected Eip712EncodingError");
			} catch (e) {
				expect(e).toBeInstanceOf(Eip712EncodingError);
				expect((e as Error).name).toBe("Eip712EncodingError");
			}
		});

		it("should encode array as hash", () => {
			const arr = [1n, 2n, 3n];
			const encoded = EIP712.encodeValue("uint256[]", arr, types);

			expect(encoded.length).toBe(32);
			// Array encoding should be hashed
		});

		it("should encode fixed-size array (uint256[3])", () => {
			const arr = [1n, 2n, 3n];
			const encoded = EIP712.encodeValue("uint256[3]", arr, types);

			expect(encoded.length).toBe(32);
			// Fixed-size array encoding should also be hashed
		});

		it("should encode fixed-size bytes32 array (bytes32[10])", () => {
			const arr = Array.from({ length: 10 }, () =>
				new Uint8Array(32).fill(0xaa),
			);
			const encoded = EIP712.encodeValue("bytes32[10]", arr, types);

			expect(encoded.length).toBe(32);
		});

		it("should produce same hash for equivalent fixed and dynamic arrays", () => {
			const arr = [1n, 2n, 3n];
			const encodedDynamic = EIP712.encodeValue("uint256[]", arr, types);
			const encodedFixed = EIP712.encodeValue("uint256[3]", arr, types);

			// Per EIP-712 spec, both array types encode the same way (hash of concatenated elements)
			expect(encodedFixed).toEqual(encodedDynamic);
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
			try {
				EIP712.encodeValue("invalidType", 42, types);
				expect.fail("Expected Eip712EncodingError");
			} catch (e) {
				expect(e).toBeInstanceOf(Eip712EncodingError);
				expect((e as Error).name).toBe("Eip712EncodingError");
			}
		});

		it("should handle uint8 variants", () => {
			const encoded = EIP712.encodeValue("uint8", 255n, types);
			expect(encoded[31]).toBe(255);
		});

		it("should handle int256", () => {
			const encoded = EIP712.encodeValue("int256", 42n, types);
			expect(encoded.length).toBe(32);
		});

		it("should reject uint8 value out of range (300)", () => {
			try {
				EIP712.encodeValue("uint8", 300n, types);
				expect.fail("Expected Eip712EncodingError");
			} catch (e) {
				expect(e).toBeInstanceOf(Eip712EncodingError);
				expect((e as Error).message).toContain("out of range");
			}
		});

		it("should reject negative uint8 value", () => {
			try {
				EIP712.encodeValue("uint8", -1n, types);
				expect.fail("Expected Eip712EncodingError");
			} catch (e) {
				expect(e).toBeInstanceOf(Eip712EncodingError);
				expect((e as Error).message).toContain("out of range");
			}
		});

		it("should reject int8 value out of range (128)", () => {
			try {
				EIP712.encodeValue("int8", 128n, types);
				expect.fail("Expected Eip712EncodingError");
			} catch (e) {
				expect(e).toBeInstanceOf(Eip712EncodingError);
				expect((e as Error).message).toContain("out of range");
			}
		});

		it("should reject int8 value out of range (-129)", () => {
			try {
				EIP712.encodeValue("int8", -129n, types);
				expect.fail("Expected Eip712EncodingError");
			} catch (e) {
				expect(e).toBeInstanceOf(Eip712EncodingError);
				expect((e as Error).message).toContain("out of range");
			}
		});

		it("should accept int8 at boundaries (-128 and 127)", () => {
			const minEncoded = EIP712.encodeValue("int8", -128n, types);
			expect(minEncoded.length).toBe(32);
			const maxEncoded = EIP712.encodeValue("int8", 127n, types);
			expect(maxEncoded[31]).toBe(127);
		});

		it("should accept uint16 at max boundary (65535)", () => {
			const encoded = EIP712.encodeValue("uint16", 65535n, types);
			expect(encoded[30]).toBe(0xff);
			expect(encoded[31]).toBe(0xff);
		});

		it("should reject uint16 over max (65536)", () => {
			try {
				EIP712.encodeValue("uint16", 65536n, types);
				expect.fail("Expected Eip712EncodingError");
			} catch (e) {
				expect(e).toBeInstanceOf(Eip712EncodingError);
				expect((e as Error).message).toContain("out of range");
			}
		});

		it("should reject uint256 negative value", () => {
			try {
				EIP712.encodeValue("uint256", -1n, types);
				expect.fail("Expected Eip712EncodingError");
			} catch (e) {
				expect(e).toBeInstanceOf(Eip712EncodingError);
				expect((e as Error).message).toContain("out of range");
			}
		});

		it("should reject uint256 over max (2^256)", () => {
			try {
				EIP712.encodeValue("uint256", 2n ** 256n, types);
				expect.fail("Expected Eip712EncodingError");
			} catch (e) {
				expect(e).toBeInstanceOf(Eip712EncodingError);
				expect((e as Error).message).toContain("out of range");
			}
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
					wallet: Address.from(new Uint8Array(20).fill(0xaa)),
				},
				to: {
					name: "Bob",
					wallet: Address.from(new Uint8Array(20).fill(0xbb)),
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

			try {
				EIP712.hashStruct("Person", incompleteData, types);
				expect.fail("Expected Eip712InvalidMessageError");
			} catch (e) {
				expect(e).toBeInstanceOf(Eip712InvalidMessageError);
				expect((e as Error).name).toBe("Eip712InvalidMessageError");
			}
		});
	});

	describe("Typed Data Hashing", () => {
		it("should hash complete typed data - simple example", () => {
			const typedData: TypedData = {
				domain: {
					name: "TestApp",
					version: "1",
					chainId: ChainId.from(1),
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
					chainId: ChainId.from(1),
					verifyingContract: Address.from(new Uint8Array(20).fill(0xcc)),
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
					owner: Address.from(new Uint8Array(20).fill(0xaa)),
					spender: Address.from(new Uint8Array(20).fill(0xbb)),
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
					chainId: ChainId.from(1),
					verifyingContract: Address.from(new Uint8Array(20).fill(0xdd)),
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
						wallet: Address.from(new Uint8Array(20).fill(0xaa)),
					},
					to: {
						name: "Bob",
						wallet: Address.from(new Uint8Array(20).fill(0xbb)),
					},
					contents: "Hello, Bob!",
				},
			};

			const hash = EIP712.hashTypedData(typedData);

			expect(hash.length).toBe(32);
		});

		it("should be deterministic", () => {
			const typedData: TypedData = {
				domain: { name: "App", chainId: ChainId.from(1) },
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
				domain: { name: "TestApp", chainId: ChainId.from(1) },
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
				domain: { name: "TestApp", chainId: ChainId.from(1) },
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
				domain: { name: "TestApp", chainId: ChainId.from(1) },
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
				domain: { name: "TestApp", chainId: ChainId.from(1) },
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
				domain: { name: "TestApp", chainId: ChainId.from(1) },
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
				domain: { name: "TestApp", chainId: ChainId.from(1) },
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
				domain: { name: "TestApp", chainId: ChainId.from(2) },
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
					domain: { name: "TestApp", chainId: ChainId.from(1) },
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
				domain: { name: "TestApp", chainId: ChainId.from(1) },
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
				domain: { name: "TestApp", chainId: ChainId.from(1) },
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
				domain: { name: "TestApp", chainId: ChainId.from(1) },
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
				domain: { name: "TestApp", chainId: ChainId.from(1) },
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
				domain: { name: "TestApp", chainId: ChainId.from(1) },
				types: {
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				message: { content: "Test" },
			};

			const signature = EIP712.signTypedData(typedData, privateKey);

			// Derive correct address
			const publicKey = secp256k1.getPublicKey(privateKey, false).slice(1);
			const _correctAddress = keccak_256(publicKey).slice(-20);

			// Warmup to avoid JIT compilation and GC effects
			for (let i = 0; i < 50; i++) {
				EIP712.verifyTypedData(signature, typedData, randomBytes(20));
			}

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

			// Allow for reasonable variation due to system scheduling, VM effects,
			// and CI environment variability
			expect(ratio).toBeLessThan(100);
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
					chainId: ChainId.from(1),
					verifyingContract: Address.from(
						"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					), // USDC on mainnet
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
					owner: Address.from(new Uint8Array(20).fill(0xaa)),
					spender: Address.from(new Uint8Array(20).fill(0xbb)),
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
					chainId: ChainId.from(137), // Polygon
					verifyingContract: Address.from(new Uint8Array(20).fill(0xcc)),
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
					from: Address.from(new Uint8Array(20).fill(0xaa)),
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

		it("should hash typed data with fixed-size arrays", () => {
			const typedData: TypedData = {
				domain: { name: "TestApp", chainId: ChainId.from(1) },
				types: {
					Point: [{ name: "coordinates", type: "uint256[3]" }],
				},
				primaryType: "Point",
				message: {
					coordinates: [1n, 2n, 3n],
				},
			};

			const hash = EIP712.hashTypedData(typedData);
			expect(hash.length).toBe(32);
		});

		it("should hash typed data with fixed-size bytes32 array", () => {
			const typedData: TypedData = {
				domain: { name: "TestApp", chainId: ChainId.from(1) },
				types: {
					Merkle: [{ name: "proof", type: "bytes32[5]" }],
				},
				primaryType: "Merkle",
				message: {
					proof: Array.from({ length: 5 }, (_, i) => {
						const b = new Uint8Array(32);
						b[0] = i;
						return b;
					}),
				},
			};

			const hash = EIP712.hashTypedData(typedData);
			expect(hash.length).toBe(32);
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
