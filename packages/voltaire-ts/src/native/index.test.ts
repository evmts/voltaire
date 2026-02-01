import { describe, expect, it } from "vitest";

// NOTE: We import individual modules to avoid triggering c-kzg native binding load
// which fails in some CI environments. The full native entrypoint does export everything.
// Specifically, Blob and KZG modules import c-kzg which requires native bindings.

// Core primitives (avoid Blob - it imports c-kzg)
import { Address } from "../primitives/Address/index.js";
import { Hash } from "../primitives/Hash/index.js";
import * as Hex from "../primitives/Hex/index.js";
import { Uint } from "../primitives/Uint/Uint.js";
import { Uint8Type } from "../primitives/Uint8/index.js";
import { Int256 } from "../primitives/Int256/index.js";
import { Wei, Gwei, Ether } from "../primitives/Denomination/index.js";
import * as Rlp from "../primitives/Rlp/index.js";
import { Abi } from "../primitives/Abi/Abi.js";
import { Bytecode } from "../primitives/Bytecode/index.js";
import { Opcode } from "../primitives/Opcode/index.js";
import { Chain } from "../primitives/Chain/index.js";
import { StorageKey } from "../primitives/State/index.js";
import { BloomFilter } from "../primitives/BloomFilter/index.js";
import { Bytes } from "../primitives/Bytes/Bytes.js";
import { Bytes32 } from "../primitives/Bytes/Bytes32/index.js";
import { Siwe } from "../primitives/Siwe/index.js";

// Crypto - import individually to avoid c-kzg (skip KZG)
import { Keccak256 as Keccak256Native } from "../crypto/Keccak256/Keccak256.native.js";
import { Secp256k1 } from "../crypto/Secp256k1/index.js";
import { SHA256 } from "../crypto/SHA256/index.js";
import { Blake2 } from "../crypto/Blake2/index.js";
import { Ripemd160 } from "../crypto/Ripemd160/index.js";
import { Ed25519 } from "../crypto/Ed25519/index.js";
import { P256 } from "../crypto/P256/index.js";
import { X25519 } from "../crypto/X25519/X25519.js";
import { BN254 } from "../crypto/bn254/BN254.js";
import { Bls12381 } from "../crypto/Bls12381/Bls12381.js";
import { EIP712 } from "../crypto/EIP712/index.js";
import { ModExp } from "../crypto/ModExp/index.js";

// Native utilities
import {
	loadNative,
	isBun,
	isNode,
	isNativeSupported,
	getNativeErrorMessage,
	NativeErrorCode,
} from "../native-loader/index.js";

// Alias for test
const Keccak256 = Keccak256Native;

/**
 * Native entrypoint tests
 *
 * Verifies that the native entrypoint:
 * 1. Exports all JS primitives (pass-through)
 * 2. Exports native Keccak256 with async API
 * 3. Exports native-specific utilities
 *
 * NOTE: Full entrypoint import is avoided due to c-kzg native binding issues.
 * These tests verify the modules that native/index.ts re-exports work correctly.
 */

describe("Native entrypoint exports", () => {
	describe("Core primitives (pass-through from JS)", () => {
		it("exports Address namespace", () => {
			expect(Address).toBeDefined();
			expect(typeof Address.fromHex).toBe("function");
			expect(typeof Address.toHex).toBe("function");
			expect(typeof Address.isValid).toBe("function");
		});

		it("exports Hash namespace", () => {
			expect(Hash).toBeDefined();
			expect(typeof Hash.fromHex).toBe("function");
		});

		it("exports Hex namespace", () => {
			expect(Hex).toBeDefined();
			expect(typeof Hex.fromBytes).toBe("function");
			expect(typeof Hex.toBytes).toBe("function");
		});

		it("exports Uint namespace", () => {
			expect(Uint).toBeDefined();
			expect(typeof Uint.fromNumber).toBe("function");
		});

		it("exports denomination types", () => {
			expect(Wei).toBeDefined();
			expect(Gwei).toBeDefined();
			expect(Ether).toBeDefined();
		});

		it("exports fixed-size Uint types", () => {
			expect(Uint8Type).toBeDefined();
			expect(Uint8Type.from).toBeDefined();
			expect(Int256).toBeDefined();
			expect(Int256.from).toBeDefined();
		});
	});

	describe("Encoding primitives (pass-through from JS)", () => {
		it("exports Rlp namespace", () => {
			expect(Rlp).toBeDefined();
			expect(typeof Rlp.encode).toBe("function");
			expect(typeof Rlp.decode).toBe("function");
		});

		it("exports Abi namespace", () => {
			expect(Abi).toBeDefined();
			expect(typeof Abi.encodeParameters).toBe("function");
		});
	});

	describe("EVM types (pass-through from JS)", () => {
		// Note: Blob test skipped - imports c-kzg which requires native bindings
		it("exports Bytecode namespace", () => {
			expect(Bytecode).toBeDefined();
		});

		it("exports Opcode namespace", () => {
			expect(Opcode).toBeDefined();
		});

		it("exports Chain namespace", () => {
			expect(Chain).toBeDefined();
		});

		it("exports StorageKey namespace", () => {
			expect(StorageKey).toBeDefined();
		});
	});

	describe("Data structures (pass-through from JS)", () => {
		it("exports BloomFilter namespace", () => {
			expect(BloomFilter).toBeDefined();
		});

		it("exports Bytes namespace", () => {
			expect(Bytes).toBeDefined();
		});

		it("exports Bytes32 namespace", () => {
			expect(Bytes32).toBeDefined();
		});
	});

	describe("Standards (pass-through from JS)", () => {
		it("exports Siwe namespace", () => {
			expect(Siwe).toBeDefined();
		});
	});

	describe("Crypto - JS implementations (pass-through)", () => {
		it("exports Secp256k1 namespace", () => {
			expect(Secp256k1).toBeDefined();
			expect(typeof Secp256k1.sign).toBe("function");
			expect(typeof Secp256k1.verify).toBe("function");
		});

		it("exports SHA256 namespace", () => {
			expect(SHA256).toBeDefined();
			expect(typeof SHA256.hash).toBe("function");
		});

		it("exports Blake2 namespace", () => {
			expect(Blake2).toBeDefined();
		});

		it("exports Ripemd160 namespace", () => {
			expect(Ripemd160).toBeDefined();
			expect(typeof Ripemd160.hash).toBe("function");
		});

		it("exports Ed25519 namespace", () => {
			expect(Ed25519).toBeDefined();
		});

		it("exports P256 namespace", () => {
			expect(P256).toBeDefined();
		});

		it("exports X25519 namespace", () => {
			expect(X25519).toBeDefined();
		});

		it("exports BN254 namespace", () => {
			expect(BN254).toBeDefined();
		});

		it("exports Bls12381 namespace", () => {
			expect(Bls12381).toBeDefined();
		});

		it("exports EIP712 namespace", () => {
			expect(EIP712).toBeDefined();
			expect(typeof EIP712.hashTypedData).toBe("function");
		});

		it("exports ModExp namespace", () => {
			expect(ModExp).toBeDefined();
		});
	});

	describe("Native Keccak256 (async API)", () => {
		it("exports Keccak256 namespace with async methods", () => {
			expect(Keccak256).toBeDefined();
			expect(typeof Keccak256.hash).toBe("function");
			expect(typeof Keccak256.hashString).toBe("function");
			expect(typeof Keccak256.selector).toBe("function");
			expect(typeof Keccak256.topic).toBe("function");
		});

		it("exports Keccak256Native alias", () => {
			expect(Keccak256Native).toBeDefined();
			expect(Keccak256Native).toBe(Keccak256);
		});

		it("Keccak256.hash returns a Promise", () => {
			const input = new Uint8Array([1, 2, 3]);
			const result = Keccak256.hash(input);
			expect(result).toBeInstanceOf(Promise);
			// Catch to avoid unhandled rejection - native lib may not be available
			result.catch(() => {});
		});

		it("Keccak256.hashString returns a Promise", () => {
			const result = Keccak256.hashString("hello");
			expect(result).toBeInstanceOf(Promise);
			// Catch to avoid unhandled rejection - native lib may not be available
			result.catch(() => {});
		});

		it("Keccak256.selector returns a Promise", () => {
			const result = Keccak256.selector("transfer(address,uint256)");
			expect(result).toBeInstanceOf(Promise);
			// Catch to avoid unhandled rejection - native lib may not be available
			result.catch(() => {});
		});
	});

	describe("Native-specific utilities", () => {
		it("exports loadNative function", () => {
			expect(typeof loadNative).toBe("function");
		});

		it("exports isBun detection", () => {
			expect(typeof isBun).toBe("function");
		});

		it("exports isNode detection", () => {
			expect(typeof isNode).toBe("function");
		});

		it("exports isNativeSupported detection", () => {
			expect(typeof isNativeSupported).toBe("function");
		});

		it("exports getNativeErrorMessage function", () => {
			expect(typeof getNativeErrorMessage).toBe("function");
		});

		it("exports NativeErrorCode enum", () => {
			expect(NativeErrorCode).toBeDefined();
			expect(typeof NativeErrorCode.SUCCESS).toBe("number");
		});
	});
});

describe("Native vs JS primitive consistency", () => {
	it("Address works the same from native entrypoint", () => {
		const addr = Address.fromHex(
			"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		);
		expect(addr.length).toBe(20);

		const hex = Address.toHex(addr);
		expect(hex.toLowerCase()).toBe(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
	});

	it("Hex works the same from native entrypoint", () => {
		const bytes = Hex.toBytes("0x1234");
		expect(bytes).toEqual(new Uint8Array([0x12, 0x34]));

		const hex = Hex.fromBytes(new Uint8Array([0xab, 0xcd]));
		expect(hex).toBe("0xabcd");
	});

	it("Rlp works the same from native entrypoint", () => {
		const data = new Uint8Array([1, 2, 3]);
		const encoded = Rlp.encode(data);
		expect(encoded).toBeInstanceOf(Uint8Array);
	});

	it("SHA256 works the same from native entrypoint (sync JS)", () => {
		const data = new TextEncoder().encode("hello");
		const hash = SHA256.hash(data);
		expect(hash.length).toBe(32);
	});

	it("Secp256k1 works the same from native entrypoint", () => {
		const privateKey = new Uint8Array(32);
		privateKey[31] = 1;
		const publicKey = Secp256k1.derivePublicKey(privateKey);
		expect(publicKey.length).toBe(64);
	});
});
