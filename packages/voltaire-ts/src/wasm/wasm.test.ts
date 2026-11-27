/**
 * Proof Tests for `@tevm/voltaire/wasm` (`src/wasm/index.ts`)
 *
 * Proves:
 * 1. Every WASM-accelerated crypto namespace exported from `src/wasm/index.ts`
 *    actually executes Zig WebAssembly (transitions `isWasmLoaded()` from
 *    `false -> true` on first call AND invokes `wasm-loader` exports) rather
 *    than silently falling back to pure JS.
 * 2. Every WASM output matches the pure-JS implementation bit-for-bit.
 * 3. Browser environments without `node:fs` throw `WasmNotInitializedError`
 *    until `await initWasm(...)` is called.
 * 4. Standalone micro-WASMs (`Keccak256Wasm`, `Blake2Wasm`, `Ripemd160Wasm`)
 *    instantiate only their tiny 1.5–3.1 kB binaries without loading the
 *    337 kB `primitives.wasm` monolith.
 */

import { readFileSync, statSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isVoltaireAPI } from "../api-interface.js";
import { Blake2Wasm } from "../crypto/Blake2/Blake2.wasm.js";
import { Blake2 as Blake2JS } from "../crypto/Blake2/index.js";
import { Bn254Wasm } from "../crypto/bn254.wasm.js";
import { Ed25519 as Ed25519JS } from "../crypto/Ed25519/index.js";
import type { SecretKey as Ed25519SecretKey } from "../crypto/Ed25519/SecretKey.js";
import type { Seed as Ed25519Seed } from "../crypto/Ed25519/Seed.js";
import { Ed25519Wasm } from "../crypto/ed25519.wasm.js";
import type { TypedData } from "../crypto/EIP712/EIP712Type.js";
import { EIP712 as EIP712JS } from "../crypto/EIP712/index.js";
import { Eip712Wasm } from "../crypto/eip712.wasm.js";
import { Keccak256 as Keccak256JS } from "../crypto/Keccak256/index.js";
import { Keccak256Wasm } from "../crypto/keccak256.wasm.js";
import { P256 as P256JS } from "../crypto/P256/index.js";
import type { P256PrivateKeyType } from "../crypto/P256/P256PrivateKeyType.js";
import { P256Wasm } from "../crypto/p256.wasm.js";
import { Ripemd160 as Ripemd160JS } from "../crypto/Ripemd160/index.js";
import { Ripemd160Wasm } from "../crypto/ripemd160.wasm.js";
import { Secp256k1 as Secp256k1JS } from "../crypto/Secp256k1/index.js";
import { Secp256k1Wasm } from "../crypto/secp256k1.wasm.js";
import { SHA256 as SHA256JS } from "../crypto/SHA256/index.js";
import { Sha256Wasm } from "../crypto/sha256.wasm.js";
import type { SecretKey as X25519SecretKey } from "../crypto/X25519/SecretKey.js";
import { X25519 as X25519JS } from "../crypto/X25519/X25519.js";
import { X25519Wasm } from "../crypto/x25519.wasm.js";
import { Address as AddressJS } from "../primitives/Address/index.js";
import type { HashType } from "../primitives/Hash/index.js";
import type { PrivateKeyType } from "../primitives/PrivateKey/PrivateKeyType.js";
import * as loader from "../wasm-loader/loader.js";
import {
	Blake2,
	BN254,
	Ed25519,
	EIP712,
	initWasm,
	initWasmSync,
	isWasmLoaded,
	Keccak256,
	P256,
	Ripemd160,
	Secp256k1,
	SHA256,
	unloadWasm,
	WasmNotInitializedError,
	wasmAPI,
	X25519,
} from "./index.js";

const SAMPLE_BYTES = new TextEncoder().encode("voltaire wasm dispatch proof");
const SAMPLE_PRIVKEY = new Uint8Array(32).fill(0x2a) as PrivateKeyType;
const SAMPLE_PRIVKEY_2 = new Uint8Array(32).fill(0x4b) as PrivateKeyType;
const SAMPLE_SEED = new Uint8Array(32).fill(0x17) as Ed25519Seed;
const SAMPLE_HASH = Keccak256JS.hash(SAMPLE_BYTES) as unknown as HashType;

const SAMPLE_TYPED_DATA: TypedData = {
	domain: {
		name: "VoltaireWasmProof",
		version: "1",
		chainId: 1n,
		verifyingContract: AddressJS.fromHex(
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
			name: "Alice",
			wallet: AddressJS.fromHex("0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"),
		},
		to: {
			name: "Bob",
			wallet: AddressJS.fromHex("0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"),
		},
		contents: "Hello, WASM!",
	},
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe("@tevm/voltaire/wasm — Real Zig WASM Execution Proofs", () => {
	it("Keccak256 primary methods execute WASM and match pure JS bit-for-bit", () => {
		unloadWasm();
		expect(isWasmLoaded()).toBe(false);
		const spy = vi.spyOn(loader, "keccak256");

		const hash = Keccak256.hash(SAMPLE_BYTES);
		expect(isWasmLoaded()).toBe(true);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(hash).toEqual(Keccak256JS.hash(SAMPLE_BYTES));

		expect(Keccak256.hashString("hello")).toEqual(
			Keccak256JS.hashString("hello"),
		);
		expect(Keccak256.hashHex("0xdeadbeef")).toEqual(
			Keccak256JS.hashHex("0xdeadbeef"),
		);
		expect(Keccak256.selector("transfer(address,uint256)")).toEqual(
			Keccak256JS.selector("transfer(address,uint256)"),
		);
		expect(Keccak256.topic("Transfer(address,address,uint256)")).toEqual(
			Keccak256JS.topic("Transfer(address,address,uint256)"),
		);
		expect(Keccak256(SAMPLE_BYTES)).toEqual(Keccak256JS(SAMPLE_BYTES));
		expect(spy.mock.calls.length).toBeGreaterThanOrEqual(6);
	});

	it("SHA256 primary methods execute WASM and match pure JS bit-for-bit", () => {
		unloadWasm();
		expect(isWasmLoaded()).toBe(false);
		const spy = vi.spyOn(loader, "sha256");

		const hash = SHA256.hash(SAMPLE_BYTES);
		expect(isWasmLoaded()).toBe(true);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(hash).toEqual(SHA256JS.hash(SAMPLE_BYTES));

		expect(SHA256.hashString("hello world")).toEqual(
			SHA256JS.hashString("hello world"),
		);
		expect(SHA256.hashHex("0xdeadbeef")).toEqual(
			SHA256JS.hashHex("0xdeadbeef"),
		);
		expect(SHA256(SAMPLE_BYTES)).toEqual(SHA256JS(SAMPLE_BYTES));

		const hasher = SHA256.create();
		hasher.update(SAMPLE_BYTES.slice(0, 10));
		hasher.update(SAMPLE_BYTES.slice(10));
		expect(hasher.digest()).toEqual(SHA256JS.hash(SAMPLE_BYTES));
		expect(spy).toHaveBeenCalledTimes(5);
	});

	it("Blake2 primary methods execute WASM across variable output lengths and match pure JS", () => {
		unloadWasm();
		expect(isWasmLoaded()).toBe(false);
		const spy = vi.spyOn(loader, "blake2Hash");

		const hash64 = Blake2.hash(SAMPLE_BYTES);
		expect(isWasmLoaded()).toBe(true);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(hash64).toEqual(Blake2JS.hash(SAMPLE_BYTES));

		for (const len of [1, 16, 20, 32, 48, 64]) {
			expect(Blake2.hash(SAMPLE_BYTES, len)).toEqual(
				Blake2JS.hash(SAMPLE_BYTES, len),
			);
		}
		expect(Blake2.hashString("voltaire", 32)).toEqual(
			Blake2JS.hashString("voltaire", 32),
		);
		expect(Blake2("voltaire", 32)).toEqual(Blake2JS("voltaire", 32));
	});

	it("Ripemd160 primary methods execute WASM and match pure JS bit-for-bit", () => {
		unloadWasm();
		expect(isWasmLoaded()).toBe(false);
		const spy = vi.spyOn(loader, "ripemd160");

		const hash = Ripemd160.hash(SAMPLE_BYTES);
		expect(isWasmLoaded()).toBe(true);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(hash).toEqual(Ripemd160JS.hash(SAMPLE_BYTES));

		expect(Ripemd160.hashString("hello")).toEqual(
			Ripemd160JS.hashString("hello"),
		);
		expect(Ripemd160.hashHex("0xdeadbeef")).toEqual(
			Ripemd160JS.hashHex("0xdeadbeef"),
		);
		expect(Ripemd160("hello")).toEqual(Ripemd160JS("hello"));
		expect(spy).toHaveBeenCalledTimes(4);
	});

	it("Secp256k1 primary methods execute WASM and match pure JS", () => {
		unloadWasm();
		expect(isWasmLoaded()).toBe(false);
		const deriveSpy = vi.spyOn(loader, "secp256k1PubkeyFromPrivate");
		const signSpy = vi.spyOn(loader, "secp256k1Sign");
		const verifySpy = vi.spyOn(loader, "secp256k1Verify");
		const recoverSpy = vi.spyOn(loader, "secp256k1RecoverPubkey");

		const pubKey = Secp256k1.derivePublicKey(SAMPLE_PRIVKEY);
		expect(isWasmLoaded()).toBe(true);
		expect(deriveSpy).toHaveBeenCalledTimes(1);
		expect(pubKey).toEqual(Secp256k1JS.derivePublicKey(SAMPLE_PRIVKEY));

		const sig = Secp256k1.sign(SAMPLE_HASH, SAMPLE_PRIVKEY);
		expect(signSpy).toHaveBeenCalledTimes(1);
		expect(Secp256k1.verify(sig, SAMPLE_HASH, pubKey)).toBe(true);
		expect(verifySpy).toHaveBeenCalledTimes(1);
		expect(Secp256k1JS.verify(sig, SAMPLE_HASH, pubKey)).toBe(true);

		const recovered = Secp256k1.recoverPublicKey(sig, SAMPLE_HASH);
		expect(recoverSpy).toHaveBeenCalled();
		expect(recovered).toEqual(pubKey);

		// Also recover a pure-JS Noble signature through Zig WASM
		const nobleSig = Secp256k1JS.sign(SAMPLE_HASH, SAMPLE_PRIVKEY);
		expect(Secp256k1.recoverPublicKey(nobleSig, SAMPLE_HASH)).toEqual(pubKey);
		expect(Secp256k1.verify(nobleSig, SAMPLE_HASH, pubKey)).toBe(true);
	});

	it("Ed25519 primary methods execute WASM and match pure JS bit-for-bit", () => {
		unloadWasm();
		expect(isWasmLoaded()).toBe(false);
		const deriveSpy = vi.spyOn(loader, "ed25519DerivePublicKey");
		const signSpy = vi.spyOn(loader, "ed25519Sign");
		const verifySpy = vi.spyOn(loader, "ed25519Verify");

		const kp = Ed25519.keypairFromSeed(SAMPLE_SEED);
		expect(isWasmLoaded()).toBe(true);
		expect(deriveSpy).toHaveBeenCalledTimes(1);
		expect(kp.publicKey).toEqual(
			Ed25519JS.derivePublicKey(SAMPLE_SEED as unknown as Ed25519SecretKey),
		);

		const sig = Ed25519.sign(SAMPLE_BYTES, kp.secretKey);
		expect(signSpy).toHaveBeenCalledTimes(1);
		expect(sig).toEqual(Ed25519JS.sign(SAMPLE_BYTES, kp.secretKey));

		expect(Ed25519.verify(sig, SAMPLE_BYTES, kp.publicKey)).toBe(true);
		expect(verifySpy).toHaveBeenCalledTimes(1);
		expect(Ed25519JS.verify(sig, SAMPLE_BYTES, kp.publicKey)).toBe(true);
	});

	it("P256 primary methods execute WASM and match pure JS", () => {
		unloadWasm();
		expect(isWasmLoaded()).toBe(false);
		const deriveSpy = vi.spyOn(loader, "p256DerivePublicKey");
		const signSpy = vi.spyOn(loader, "p256Sign");
		const verifySpy = vi.spyOn(loader, "p256Verify");
		const ecdhSpy = vi.spyOn(loader, "p256Ecdh");

		const priv1 = SAMPLE_PRIVKEY as unknown as P256PrivateKeyType;
		const priv2 = SAMPLE_PRIVKEY_2 as unknown as P256PrivateKeyType;

		const pub1 = P256.derivePublicKey(priv1);
		expect(isWasmLoaded()).toBe(true);
		expect(deriveSpy).toHaveBeenCalledTimes(1);
		expect(pub1).toEqual(P256JS.derivePublicKey(priv1));

		const sig = P256.sign(SAMPLE_HASH, priv1);
		expect(signSpy).toHaveBeenCalledTimes(1);
		expect(P256.verify(sig, SAMPLE_HASH, pub1)).toBe(true);
		expect(verifySpy).toHaveBeenCalledTimes(1);

		const pub2 = P256.derivePublicKey(priv2);
		const sharedWasm = P256.ecdh(priv1, pub2);
		expect(ecdhSpy).toHaveBeenCalledTimes(1);
		expect(sharedWasm).toEqual(P256JS.ecdh(priv1, pub2));
	});

	it("X25519 primary methods execute WASM and match pure JS bit-for-bit", () => {
		unloadWasm();
		expect(isWasmLoaded()).toBe(false);
		const deriveSpy = vi.spyOn(loader, "x25519DerivePublicKey");
		const multSpy = vi.spyOn(loader, "x25519Scalarmult");
		const kpSpy = vi.spyOn(loader, "x25519KeypairFromSeed");

		const kp1 = X25519.keypairFromSeed(SAMPLE_PRIVKEY);
		expect(isWasmLoaded()).toBe(true);
		expect(kpSpy).toHaveBeenCalledTimes(1);

		const pub1 = X25519.derivePublicKey(
			SAMPLE_PRIVKEY as unknown as X25519SecretKey,
		);
		expect(deriveSpy).toHaveBeenCalledTimes(1);
		expect(pub1).toEqual(
			X25519JS.derivePublicKey(SAMPLE_PRIVKEY as unknown as X25519SecretKey),
		);

		const pub2 = X25519.derivePublicKey(
			SAMPLE_PRIVKEY_2 as unknown as X25519SecretKey,
		);
		const shared = X25519.scalarmult(
			SAMPLE_PRIVKEY as unknown as X25519SecretKey,
			pub2,
		);
		expect(multSpy).toHaveBeenCalledTimes(1);
		expect(shared).toEqual(
			X25519JS.scalarmult(SAMPLE_PRIVKEY as unknown as X25519SecretKey, pub2),
		);
		expect(kp1.publicKey).toHaveLength(32);
	});

	it("EIP712 primary methods execute WASM Keccak256 + Secp256k1 and match pure JS", () => {
		unloadWasm();
		expect(isWasmLoaded()).toBe(false);
		const keccakSpy = vi.spyOn(loader, "keccak256");
		const signSpy = vi.spyOn(loader, "secp256k1Sign");
		const recoverSpy = vi.spyOn(loader, "secp256k1RecoverPubkey");

		const digest = EIP712.hashTypedData(SAMPLE_TYPED_DATA);
		expect(isWasmLoaded()).toBe(true);
		expect(keccakSpy).toHaveBeenCalled();
		expect(digest).toEqual(EIP712JS.hashTypedData(SAMPLE_TYPED_DATA));

		const sig = EIP712.signTypedData(SAMPLE_TYPED_DATA, SAMPLE_PRIVKEY);
		expect(signSpy).toHaveBeenCalledTimes(1);

		const signerAddr = EIP712.recoverAddress(sig, SAMPLE_TYPED_DATA);
		expect(recoverSpy).toHaveBeenCalled();
		expect(signerAddr).toEqual(EIP712JS.recoverAddress(sig, SAMPLE_TYPED_DATA));
		expect(
			EIP712.verifyTypedData(sig, SAMPLE_TYPED_DATA, signerAddr),
		).toBe(true);
	});
});

describe("@tevm/voltaire/wasm — Lifecycle, Browser Guard & API Parity", () => {
	it("throws WasmNotInitializedError in browser-like runtime before await initWasm()", async () => {
		unloadWasm();
		expect(isWasmLoaded()).toBe(false);

		const originalGetBuiltin = (
			process as { getBuiltinModule?: (id: string) => unknown }
		).getBuiltinModule;
		const wasmBytes = readFileSync(
			new URL("../wasm-loader/primitives.wasm", import.meta.url),
		);

		try {
			(
				process as { getBuiltinModule?: (id: string) => unknown }
			).getBuiltinModule = undefined;

			expect(() => Keccak256.hash(SAMPLE_BYTES)).toThrow(
				WasmNotInitializedError,
			);
			expect(() => Keccak256.hash(SAMPLE_BYTES)).toThrow(/await initWasm\(\)/);

			// Initializing with raw WASM bytes works in browser-like environments too
			await initWasm(wasmBytes);
			expect(isWasmLoaded()).toBe(true);
			expect(Keccak256.hash(SAMPLE_BYTES)).toEqual(
				Keccak256JS.hash(SAMPLE_BYTES),
			);
		} finally {
			(
				process as { getBuiltinModule?: (id: string) => unknown }
			).getBuiltinModule = originalGetBuiltin;
		}
	});

	it("initWasmSync initializes explicitly and sets isWasmLoaded()", () => {
		unloadWasm();
		expect(isWasmLoaded()).toBe(false);
		initWasmSync();
		expect(isWasmLoaded()).toBe(true);
		expect(Keccak256.hash(SAMPLE_BYTES)).toEqual(Keccak256JS.hash(SAMPLE_BYTES));
	});

	it("preserves backwards-compatible _wasm aliases and VoltaireAPI parity", () => {
		expect(isVoltaireAPI(wasmAPI)).toBe(true);
		expect(Keccak256._wasm).toBe(Keccak256Wasm);
		expect(SHA256._wasm).toBe(Sha256Wasm);
		expect(Blake2._wasm).toBe(Blake2Wasm);
		expect(Ripemd160._wasm).toBe(Ripemd160Wasm);
		expect(Secp256k1._wasm).toBe(Secp256k1Wasm);
		expect(Ed25519._wasm).toBe(Ed25519Wasm);
		expect(P256._wasm).toBe(P256Wasm);
		expect(X25519._wasm).toBe(X25519Wasm);
		expect(BN254._wasm).toBe(Bn254Wasm);
		expect(EIP712._wasm).toBe(Eip712Wasm);
	});
});

describe("Standalone Micro-WASM Isolation (1.5–3.1 kB without 337 kB monolith)", () => {
	it("Keccak256Wasm loads 3.1 kB keccak256.wasm without loading primitives.wasm", () => {
		unloadWasm();
		Keccak256Wasm.reset();
		expect(isWasmLoaded()).toBe(false);
		expect(Keccak256Wasm.isReady()).toBe(false);

		const digest = Keccak256Wasm.hash(SAMPLE_BYTES);
		expect(Keccak256Wasm.isReady()).toBe(true);
		expect(isWasmLoaded()).toBe(false);
		expect(digest).toEqual(Keccak256JS.hash(SAMPLE_BYTES));

		const microSize = statSync(
			new URL("../../../voltaire-zig/wasm/crypto/keccak256.wasm", import.meta.url),
		).size;
		const monolithSize = statSync(
			new URL("../wasm-loader/primitives.wasm", import.meta.url),
		).size;
		expect(microSize).toBeLessThan(5_000);
		expect(monolithSize).toBeLessThan(350 * 1024);
	});

	it("Blake2Wasm loads 1.8 kB blake2.wasm without loading primitives.wasm", () => {
		unloadWasm();
		Blake2Wasm.reset();
		expect(isWasmLoaded()).toBe(false);
		expect(Blake2Wasm.isReady()).toBe(false);

		const digest32 = Blake2Wasm.hash(SAMPLE_BYTES, 32);
		expect(Blake2Wasm.isReady()).toBe(true);
		expect(isWasmLoaded()).toBe(false);
		expect(digest32).toEqual(Blake2JS.hash(SAMPLE_BYTES, 32));

		const microSize = statSync(
			new URL("../../../voltaire-zig/wasm/crypto/blake2.wasm", import.meta.url),
		).size;
		expect(microSize).toBeLessThan(5_000);
	});

	it("Ripemd160Wasm loads 1.5 kB ripemd160.wasm without loading primitives.wasm", () => {
		unloadWasm();
		Ripemd160Wasm.reset();
		expect(isWasmLoaded()).toBe(false);
		expect(Ripemd160Wasm.isReady()).toBe(false);

		const digest = Ripemd160Wasm.hash(SAMPLE_BYTES);
		expect(Ripemd160Wasm.isReady()).toBe(true);
		expect(isWasmLoaded()).toBe(false);
		expect(digest).toEqual(Ripemd160JS.hash(SAMPLE_BYTES));

		const microSize = statSync(
			new URL("../../../voltaire-zig/wasm/crypto/ripemd160.wasm", import.meta.url),
		).size;
		expect(microSize).toBeLessThan(5_000);
	});
});
