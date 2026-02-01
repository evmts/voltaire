/**
 * Documentation Code Sample Validation Tests
 *
 * This file tests that code samples from the documentation work correctly.
 * Run with: bun run test:run -- docs-samples
 */

import { describe, expect, it } from "vitest";

// Test imports from docs/getting-started.mdx
describe.skip("Getting Started Imports", () => {
	it("should import primitives from @tevm/voltaire", async () => {
		const {
			Abi,
			AccessList,
			Address,
			Authorization,
			Base64,
			BinaryTree,
			Blob,
			BloomFilter,
			Bytecode,
			Chain,
			// ChainId is not exported at top level
			// Denomination is not exported at top level
			Ens,
			EventLog,
			FeeMarket,
			GasConstants,
			Hardfork,
			Hash,
			Hex,
			// Int is not exported at top level
			// Nonce is not exported at top level
			Opcode,
			// PrivateKey is not exported at top level
			// PublicKey is not exported at top level
			Rlp,
			// Signature is not exported at top level
			Siwe,
			State,
			Transaction,
			Uint,
		} = await import("../src/index.js");

		expect(Address).toBeDefined();
		expect(Hex).toBeDefined();
		expect(Hash).toBeDefined();
		expect(Rlp).toBeDefined();
		expect(Abi).toBeDefined();
		expect(Transaction).toBeDefined();
		expect(Uint).toBeDefined();
		expect(Bytecode).toBeDefined();
		expect(GasConstants).toBeDefined();
		expect(Opcode).toBeDefined();
		expect(Base64).toBeDefined();
		expect(Blob).toBeDefined();
		expect(BloomFilter).toBeDefined();
		expect(Chain).toBeDefined();
		expect(Ens).toBeDefined();
		expect(EventLog).toBeDefined();
		expect(FeeMarket).toBeDefined();
		expect(Hardfork).toBeDefined();
		expect(Siwe).toBeDefined();
		expect(State).toBeDefined();
		expect(AccessList).toBeDefined();
		expect(Authorization).toBeDefined();
		expect(BinaryTree).toBeDefined();
	});

	it("should import cryptography modules from @tevm/voltaire", async () => {
		const {
			// AesGcm is exported
			AesGcm,
			Bip39,
			Blake2,
			Bls12381,
			BN254,
			Ed25519,
			EIP712,
			HDWallet,
			Keccak256,
			KZG,
			P256,
			Ripemd160,
			Secp256k1,
			SHA256,
			X25519,
		} = await import("../src/index.js");

		expect(Keccak256).toBeDefined();
		expect(Secp256k1).toBeDefined();
		expect(SHA256).toBeDefined();
		expect(Ripemd160).toBeDefined();
		expect(Blake2).toBeDefined();
		expect(Ed25519).toBeDefined();
		expect(EIP712).toBeDefined();
		expect(Bip39).toBeDefined();
		expect(HDWallet).toBeDefined();
		expect(KZG).toBeDefined();
		expect(BN254).toBeDefined();
		expect(Bls12381).toBeDefined();
		expect(P256).toBeDefined();
		expect(AesGcm).toBeDefined();
		expect(X25519).toBeDefined();
	});
});

// Test code samples from docs/index.mdx
describe("Index Page Code Samples", () => {
	it("should demonstrate Address utilities", async () => {
		const { Address } = await import("../src/primitives/Address/index.js");

		const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
		expect(Address.toHex(addr)).toBe(
			"0x742d35cc6634c0532925a3b844bc9e7595f51e3e",
		);
		// toChecksummed requires keccak256 dependency
	});

	it("should demonstrate Hex encoding", async () => {
		const { Hex } = await import("../src/primitives/Hex/index.js");

		const message = "Hello, Voltaire!";
		const hexMsg = Hex.fromString(message);
		expect(hexMsg).toBeDefined();
		expect(Hex.toString(hexMsg)).toBe(message);
	});

	it("should demonstrate Keccak256 hashing", async () => {
		const { Keccak256 } = await import("../src/crypto/Keccak256/index.js");
		const { Hex } = await import("../src/primitives/Hex/index.js");

		// Note: Keccak256.hash expects Uint8Array, not hex string
		// Hex.fromString returns a hex string, so we need toBytes
		const hash = Keccak256.hash(Hex.toBytes(Hex.fromString("Voltaire")));
		expect(hash.length).toBe(32);
		expect(Hex.fromBytes(hash)).toMatch(/^0x[0-9a-f]{64}$/);
	});

	it("should demonstrate Uint256 operations", async () => {
		const Uint256 = await import("../src/primitives/Uint/index.js");

		const a = Uint256.from(100n);
		const b = Uint256.from(42n);
		// Note: API is `plus` not `add`
		const sum = Uint256.plus(a, b);
		expect(Uint256.toBigInt(sum)).toBe(142n);
	});
});

// Test code samples from docs/primitives/address/index.mdx
describe("Address Documentation Samples", () => {
	it("should create address from hex string", async () => {
		const { Address } = await import("../src/primitives/Address/index.js");

		const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
		expect(addr.length).toBe(20);
		expect(Address.toHex(addr)).toBe(
			"0x742d35cc6634c0532925a3b844bc9e7595f51e3e",
		);
	});

	it("should validate addresses", async () => {
		const { Address } = await import("../src/primitives/Address/index.js");

		expect(Address.isValid("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e")).toBe(
			true,
		);
		expect(Address.isValid("invalid")).toBe(false);
		expect(Address.isValid("0x123")).toBe(false);
	});

	it("should compare addresses", async () => {
		const { Address } = await import("../src/primitives/Address/index.js");

		const addr1 = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
		const addr2 = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
		const addr3 = Address.from("0x0000000000000000000000000000000000000000");

		expect(Address.equals(addr1, addr2)).toBe(true);
		expect(Address.equals(addr1, addr3)).toBe(false);
	});

	it("should check for zero address", async () => {
		const { Address } = await import("../src/primitives/Address/index.js");

		const zeroAddr = Address.from("0x0000000000000000000000000000000000000000");
		const nonZeroAddr = Address.from(
			"0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e",
		);

		expect(Address.isZero(zeroAddr)).toBe(true);
		expect(Address.isZero(nonZeroAddr)).toBe(false);
	});

	it("should clone addresses", async () => {
		const { Address } = await import("../src/primitives/Address/index.js");

		const original = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
		const clone = Address.clone(original);

		expect(Address.equals(original, clone)).toBe(true);
		expect(original === clone).toBe(false);
	});

	it("should derive address from private key", async () => {
		const { Address } = await import("../src/primitives/Address/index.js");

		// Known test vector from Foundry anvil
		const privateKey = new Uint8Array(
			Buffer.from(
				"ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
				"hex",
			),
		);
		const addr = Address.fromPrivateKey(privateKey);

		expect(Address.toHex(addr)).toBe(
			"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
		);
	});
});

// Test code samples from docs/primitives/hex/index.mdx
describe("Hex Documentation Samples", () => {
	it("should convert to/from bytes", async () => {
		const { Hex } = await import("../src/primitives/Hex/index.js");

		const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
		const hex = Hex.fromBytes(bytes);
		expect(hex).toBe("0x0102030405");
		expect(Hex.toBytes(hex)).toEqual(bytes);
	});

	it("should convert to/from string", async () => {
		const { Hex } = await import("../src/primitives/Hex/index.js");

		const str = "hello";
		const hex = Hex.fromString(str);
		expect(Hex.toString(hex)).toBe(str);
	});

	it("should validate hex strings", async () => {
		const { Hex } = await import("../src/primitives/Hex/index.js");

		// Note: API is `isHex` not `isValid`
		expect(Hex.isHex("0x1234")).toBe(true);
		expect(Hex.isHex("0xabcdef")).toBe(true);
		expect(Hex.isHex("invalid")).toBe(false);
		expect(Hex.isHex("0xGHIJ")).toBe(false);
	});
});

// Test code samples from docs/crypto/keccak256/*.mdx
describe("Keccak256 Documentation Samples", () => {
	it("should hash bytes", async () => {
		const { Keccak256 } = await import("../src/crypto/Keccak256/index.js");
		const { Hex } = await import("../src/primitives/Hex/index.js");

		const data = Hex.toBytes("0x0102030405");
		const hash = Keccak256.hash(data);

		expect(hash.length).toBe(32);
		expect(Hex.fromBytes(hash)).toMatch(/^0x[0-9a-f]{64}$/);
	});

	it("should hash string", async () => {
		const { Keccak256 } = await import("../src/crypto/Keccak256/index.js");
		const { Hex } = await import("../src/primitives/Hex/index.js");

		const hash = Keccak256.hashString("");
		expect(Hex.fromBytes(hash)).toBe(
			"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
		);
	});

	it("should compute function selector", async () => {
		const { Keccak256 } = await import("../src/crypto/Keccak256/index.js");
		const { Hex } = await import("../src/primitives/Hex/index.js");

		const selector = Keccak256.selector("transfer(address,uint256)");
		expect(selector.length).toBe(4);
		expect(Hex.fromBytes(selector)).toBe("0xa9059cbb");
	});

	it("should compute event topic", async () => {
		const { Keccak256 } = await import("../src/crypto/Keccak256/index.js");
		const { Hex } = await import("../src/primitives/Hex/index.js");

		const topic = Keccak256.topic("Transfer(address,address,uint256)");
		expect(topic.length).toBe(32);
		expect(Hex.fromBytes(topic)).toBe(
			"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
		);
	});
});

// Test code samples from docs/crypto/secp256k1/*.mdx
describe("Secp256k1 Documentation Samples", () => {
	it("should sign and verify a message", async () => {
		const { Secp256k1 } = await import("../src/crypto/Secp256k1/index.js");
		const { Keccak256 } = await import("../src/crypto/Keccak256/index.js");

		const privateKey = new Uint8Array(32);
		privateKey[31] = 1; // Private key = 1

		const messageHash = Keccak256.hashString("Hello, Ethereum!");
		const signature = Secp256k1.sign(messageHash, privateKey);

		expect(signature.r.length).toBe(32);
		expect(signature.s.length).toBe(32);
		expect(signature.v === 27 || signature.v === 28).toBe(true);

		const publicKey = Secp256k1.derivePublicKey(privateKey);
		const isValid = Secp256k1.verify(signature, messageHash, publicKey);
		expect(isValid).toBe(true);
	});

	it("should derive public key from private key", async () => {
		const { Secp256k1 } = await import("../src/crypto/Secp256k1/index.js");

		const privateKey = new Uint8Array(32);
		privateKey[31] = 1; // Private key = 1

		const publicKey = Secp256k1.derivePublicKey(privateKey);
		expect(publicKey.length).toBe(64); // x || y, no prefix
	});

	it("should recover public key from signature", async () => {
		const { Secp256k1 } = await import("../src/crypto/Secp256k1/index.js");
		const { Keccak256 } = await import("../src/crypto/Keccak256/index.js");

		const privateKey = new Uint8Array(32);
		privateKey[31] = 42;

		const messageHash = Keccak256.hashString("test recovery");
		const signature = Secp256k1.sign(messageHash, privateKey);
		const publicKey = Secp256k1.derivePublicKey(privateKey);
		const recovered = Secp256k1.recoverPublicKey(signature, messageHash);

		expect(recovered).toEqual(publicKey);
	});

	it("should validate private key", async () => {
		const { Secp256k1 } = await import("../src/crypto/Secp256k1/index.js");

		// Valid private key
		const validKey = new Uint8Array(32);
		validKey[31] = 1;
		expect(Secp256k1.isValidPrivateKey(validKey)).toBe(true);

		// Zero key is invalid
		const zeroKey = new Uint8Array(32);
		expect(Secp256k1.isValidPrivateKey(zeroKey)).toBe(false);
	});
});

// Test code samples from docs/crypto/sha256/*.mdx
describe("SHA256 Documentation Samples", () => {
	it("should hash bytes", async () => {
		const { SHA256 } = await import("../src/crypto/SHA256/index.js");
		const { Hex } = await import("../src/primitives/Hex/index.js");

		const data = new Uint8Array([1, 2, 3, 4, 5]);
		const hash = SHA256.hash(data);

		expect(hash.length).toBe(32);
		expect(Hex.fromBytes(hash)).toMatch(/^0x[0-9a-f]{64}$/);
	});

	it("should hash string", async () => {
		const { SHA256 } = await import("../src/crypto/SHA256/index.js");
		const { Hex } = await import("../src/primitives/Hex/index.js");

		const hash = SHA256.hashString("hello world");
		expect(hash.length).toBe(32);
		// Known SHA256 hash of "hello world"
		expect(Hex.fromBytes(hash)).toBe(
			"0xb94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
		);
	});
});

// Test code samples from docs/primitives/rlp/*.mdx
describe("RLP Documentation Samples", () => {
	it("should encode and decode values", async () => {
		const { Rlp } = await import("../src/primitives/Rlp/index.js");

		// Encode simple byte string
		const encoded = Rlp.encode(new Uint8Array([0x01, 0x02, 0x03]));
		expect(encoded).toBeDefined();

		// Decode back - returns { data: BrandedRlp, remainder: Uint8Array }
		const decoded = Rlp.decode(encoded);
		expect(decoded.data.type).toBe("bytes");
	});

	it("should encode lists", async () => {
		const { Rlp } = await import("../src/primitives/Rlp/index.js");

		const list = [
			new Uint8Array([0x01]),
			new Uint8Array([0x02]),
			new Uint8Array([0x03]),
		];

		const encoded = Rlp.encodeList(list);
		expect(encoded).toBeDefined();

		// Decode back - returns { data: BrandedRlp, remainder: Uint8Array }
		const decoded = Rlp.decode(encoded);
		expect(decoded.data.type).toBe("list");
	});
});

// Test tree-shaking imports (docs/getting-started/tree-shaking.mdx)
describe("Tree-Shaking Import Patterns", () => {
	it("should support direct function imports", async () => {
		const { fromHex, toHex, equals } = await import(
			"../src/primitives/Address/index.js"
		);

		const addr = fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
		const hex = toHex(addr);
		expect(hex).toBe("0x742d35cc6634c0532925a3b844bc9e7595f51e3e");
	});

	it("should support namespace imports", async () => {
		const Address = await import("../src/primitives/Address/index.js");

		const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
		expect(Address.toHex(addr)).toBe(
			"0x742d35cc6634c0532925a3b844bc9e7595f51e3e",
		);
	});
});

// Test subpath imports (from package.json exports)
describe("Subpath Imports", () => {
	// These test that the package.json exports work correctly
	// Note: These need to be tested against the built dist files

	it("should verify Address module has expected exports", async () => {
		const Address = await import("../src/primitives/Address/index.js");

		expect(Address.Address).toBeDefined();
		expect(Address.fromHex).toBeDefined();
		expect(Address.toHex).toBeDefined();
		expect(Address.equals).toBeDefined();
	});

	it("should verify Keccak256 module has expected exports", async () => {
		const { Keccak256 } = await import("../src/crypto/Keccak256/index.js");

		expect(Keccak256).toBeDefined();
		expect(Keccak256.hash).toBeDefined();
		expect(Keccak256.hashString).toBeDefined();
		expect(Keccak256.selector).toBeDefined();
		expect(Keccak256.topic).toBeDefined();
	});

	it("should verify Secp256k1 module has expected exports", async () => {
		const { Secp256k1 } = await import("../src/crypto/Secp256k1/index.js");

		expect(Secp256k1).toBeDefined();
		expect(Secp256k1.sign).toBeDefined();
		expect(Secp256k1.verify).toBeDefined();
		expect(Secp256k1.derivePublicKey).toBeDefined();
		expect(Secp256k1.recoverPublicKey).toBeDefined();
		expect(Secp256k1.isValidPrivateKey).toBeDefined();
	});
});
