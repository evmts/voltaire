import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { isVoltaireAPI } from "../api-interface.js";
import { Blake2InvalidOutputLengthError } from "../crypto/Blake2/errors.js";
import { Blake2 as Blake2JS } from "../crypto/Blake2/index.js";
import { Bls12381 as Bls12381JS } from "../crypto/Bls12381/Bls12381.js";
import { BN254 as BN254JS } from "../crypto/bn254/BN254.js";
import { Ed25519 as Ed25519JS } from "../crypto/Ed25519/index.js";
import { Keccak256 as Keccak256JS } from "../crypto/Keccak256/index.js";
import { KzgNotInitializedError } from "../crypto/KZG/errors.js";
import { ModExp as ModExpJS } from "../crypto/ModExp/index.js";
import { P256 as P256JS } from "../crypto/P256/index.js";
import { Ripemd160 as Ripemd160JS } from "../crypto/Ripemd160/index.js";
import { Secp256k1 as Secp256k1JS } from "../crypto/Secp256k1/index.js";
import { SHA256 as SHA256JS } from "../crypto/SHA256/index.js";
import { X25519 as X25519JS } from "../crypto/X25519/X25519.js";
import * as Native from "./index.js";

const {
	Address,
	AesGcm,
	Blake2,
	Bls12381,
	BN254,
	bunFfiSymbols,
	Ed25519,
	EIP712,
	getNativeErrorMessage,
	getPlatform,
	Hash,
	Hex,
	isBun,
	isNativeLoaded,
	isNativeSupported,
	isNode,
	Keccak256,
	Keccak256Native,
	KZG,
	loadNative,
	loadNativeSync,
	ModExp,
	nativeAPI,
	NativeErrorCode,
	NativeLibraryNotFoundError,
	P256,
	Ripemd160,
	Rlp,
	Secp256k1,
	SHA256,
	unloadNative,
	X25519,
} = Native;

const utf8 = (s: string) => new TextEncoder().encode(s);

const REPO_ROOT = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../../..",
);
const TRUSTED_SETUP_PATH = path.join(
	REPO_ROOT,
	"packages/voltaire-zig/lib/c-kzg-4844/src/trusted_setup.txt",
);

function canLoadLiveNative(): boolean {
	try {
		unloadNative();
		loadNativeSync();
		return true;
	} catch {
		return false;
	}
}

function writeFp64BE(buf: Uint8Array, offset: number, value: bigint): void {
	let v = value;
	for (let i = 63; i >= 16; i--) {
		buf[offset + i] = Number(v & 0xffn);
		v >>= 8n;
	}
}

/**
 * Create a CommonJS Node-API-shaped test addon so Vitest on Node exercises
 * synchronous marshaling, return-code checks, and buffer handling across all
 * 13 native-wired crypto modules even when no compiled `.node` addon exists.
 */
function writeNodeApiFixtureAddon(dir: string): string {
	const addonPath = path.join(dir, "voltaire_test_addon.cjs");
	const source = `
const { createHash, createCipheriv, createDecipheriv } = require("node:crypto");
let kzgLoaded = false;

function bytesToBigInt(bytes, len) {
	let v = 0n;
	for (let i = 0; i < len; i++) v = (v << 8n) | BigInt(bytes[i] ?? 0);
	return v;
}

function modPow(base, exp, mod) {
	if (mod === 1n) return 0n;
	let result = 1n;
	let b = base % mod;
	let e = exp;
	while (e > 0n) {
		if (e & 1n) result = (result * b) % mod;
		e >>= 1n;
		b = (b * b) % mod;
	}
	return result;
}

function writeBn254Generator(out) {
	out.fill(0);
	out[31] = 1;
	out[63] = 2;
}

module.exports = {
	primitives_keccak256(data, len, out) {
		const digest = createHash("sha256").update(data.subarray(0, len)).digest();
		for (let i = 0; i < 32; i++) out[i] = digest[i] ^ 0x5a;
		return 0;
	},
	primitives_calculate_create_address(sender, nonce, out) {
		for (let i = 0; i < 20; i++) out[i] = (sender[i] ^ Number(nonce & 0xffn)) & 0xff;
		return 0;
	},
	primitives_sha256(data, len, out) {
		out.set(createHash("sha256").update(data.subarray(0, len)).digest());
		return 0;
	},
	primitives_ripemd160(data, len, out) {
		out.set(createHash("ripemd160").update(data.subarray(0, len)).digest());
		return 0;
	},
	primitives_blake2b(data, len, out) {
		out.set(createHash("blake2b512").update(data.subarray(0, len)).digest());
		return 0;
	},
	blake2Hash(data, len, out, outLen) {
		if (outLen < 1 || outLen > 64) return -5;
		const digest = createHash("blake2b512")
			.update(Buffer.concat([Buffer.from([outLen]), data.subarray(0, len)]))
			.digest();
		out.set(digest.subarray(0, outLen));
		return 0;
	},
	primitives_secp256k1_pubkey_from_private(priv, out) {
		for (let i = 0; i < 64; i++) out[i] = priv[i % 32] ^ (i + 1);
		return 0;
	},
	secp256k1Sign(hash, priv, outSig, outRecid) {
		for (let i = 0; i < 32; i++) {
			outSig[i] = hash[i] ^ 0x11;
			outSig[32 + i] = priv[i] ^ 0x22;
		}
		outRecid[0] = 1;
		return 0;
	},
	secp256k1Verify(hash, sig, pub) {
		return sig[0] === (hash[0] ^ 0x11) && pub.length === 64 ? 1 : 0;
	},
	primitives_secp256k1_recover_pubkey(hash, r, s, v, outPub) {
		if (v !== 27 && v !== 28 && v !== 0 && v !== 1) return -6;
		const priv = new Uint8Array(32);
		for (let i = 0; i < 32; i++) priv[i] = s[i] ^ 0x22;
		for (let i = 0; i < 64; i++) outPub[i] = priv[i % 32] ^ (i + 1);
		return 0;
	},
	primitives_secp256k1_validate_signature(r, s) {
		return r.some((b) => b !== 0) && s.some((b) => b !== 0);
	},
	primitives_generate_private_key(out) {
		out.fill(0);
		out[31] = 7;
		return 0;
	},
	p256DerivePublicKey(priv, out) {
		const gx = Buffer.from("6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296", "hex");
		const gy = Buffer.from("4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5", "hex");
		out.set(gx, 0);
		out.set(gy, 32);
		return 0;
	},
	p256Sign(hash, priv, outSig) {
		outSig.set(hash, 0);
		outSig.set(priv, 32);
		return 0;
	},
	p256Verify(hash, sig, pub) {
		return sig[0] === hash[0] && pub.length === 64 ? 0 : 1;
	},
	p256Ecdh(priv, pub, outShared) {
		for (let i = 0; i < 32; i++) outShared[i] = priv[i] ^ pub[i];
		return 0;
	},
	ed25519DerivePublicKey(expandedSecret, outPub) {
		outPub.set(expandedSecret.subarray(32, 64));
		return 0;
	},
	ed25519Sign(msg, msgLen, expandedSecret, outSig) {
		const h = createHash("sha512").update(msg.subarray(0, msgLen)).update(expandedSecret.subarray(0, 32)).digest();
		outSig.set(h);
		return 0;
	},
	ed25519Verify(msg, msgLen, sig, pub) {
		return sig.length === 64 && pub.length === 32 && msgLen >= 0 && sig[0] !== 0xff ? 0 : 1;
	},
	x25519DerivePublicKey(secret, outPub) {
		for (let i = 0; i < 32; i++) outPub[i] = secret[i] ^ 0x33;
		return 0;
	},
	x25519Scalarmult(secret, pub, outShared) {
		for (let i = 0; i < 32; i++) outShared[i] = (secret[i] ^ pub[i]) | 1;
		return 0;
	},
	x25519KeypairFromSeed(seed, outSecret, outPub) {
		outSecret.set(seed);
		for (let i = 0; i < 32; i++) outPub[i] = seed[i] ^ 0x33;
		return 0;
	},
	aesGcm128Encrypt(pt, ptLen, key, nonce, ad, adLen, out) {
		const cipher = createCipheriv("aes-128-gcm", key.subarray(0, 16), nonce.subarray(0, 12));
		if (adLen > 0) cipher.setAAD(ad.subarray(0, adLen));
		out.set(Buffer.concat([cipher.update(pt.subarray(0, ptLen)), cipher.final(), cipher.getAuthTag()]));
		return 0;
	},
	aesGcm128Decrypt(ct, ctLen, key, nonce, ad, adLen, out) {
		try {
			const decipher = createDecipheriv("aes-128-gcm", key.subarray(0, 16), nonce.subarray(0, 12));
			if (adLen > 0) decipher.setAAD(ad.subarray(0, adLen));
			decipher.setAuthTag(ct.subarray(ctLen - 16, ctLen));
			out.set(Buffer.concat([decipher.update(ct.subarray(0, ctLen - 16)), decipher.final()]));
			return 0;
		} catch {
			return 1;
		}
	},
	aesGcm256Encrypt(pt, ptLen, key, nonce, ad, adLen, out) {
		const cipher = createCipheriv("aes-256-gcm", key.subarray(0, 32), nonce.subarray(0, 12));
		if (adLen > 0) cipher.setAAD(ad.subarray(0, adLen));
		out.set(Buffer.concat([cipher.update(pt.subarray(0, ptLen)), cipher.final(), cipher.getAuthTag()]));
		return 0;
	},
	aesGcm256Decrypt(ct, ctLen, key, nonce, ad, adLen, out) {
		try {
			const decipher = createDecipheriv("aes-256-gcm", key.subarray(0, 32), nonce.subarray(0, 12));
			if (adLen > 0) decipher.setAAD(ad.subarray(0, adLen));
			decipher.setAuthTag(ct.subarray(ctLen - 16, ctLen));
			out.set(Buffer.concat([decipher.update(ct.subarray(0, ctLen - 16)), decipher.final()]));
			return 0;
		} catch {
			return 1;
		}
	},
	kzg_load_trusted_setup() {
		kzgLoaded = true;
		return 0;
	},
	kzg_load_trusted_setup_bytes(bytes, len) {
		if (!bytes || len <= 0) return -3;
		kzgLoaded = true;
		return 0;
	},
	kzg_free_trusted_setup() {
		kzgLoaded = false;
		return 0;
	},
	kzg_blob_to_commitment(blob, out) {
		if (!kzgLoaded) return -20;
		out.fill(0);
		out[0] = 0xc0;
		out[47] = blob[31];
		return 0;
	},
	kzg_compute_proof(blob, z, outProof, outY) {
		if (!kzgLoaded) return -20;
		outProof.fill(0);
		outProof[0] = 0xc0;
		outY.set(z);
		return 0;
	},
	kzg_compute_blob_proof(blob, commitment, outProof) {
		if (!kzgLoaded) return -20;
		outProof.set(commitment);
		return 0;
	},
	kzg_verify_proof(commitment, z, y, proof) {
		if (!kzgLoaded) return -20;
		return commitment[0] === 0xc0 && proof[0] === 0xc0 && y[0] === z[0] ? 1 : 0;
	},
	kzg_verify_blob_proof(blob, commitment, proof) {
		if (!kzgLoaded) return -20;
		return commitment[0] === 0xc0 && proof[0] === commitment[0] ? 1 : 0;
	},
	primitives_bn254_ecadd(input, inputLen, output, outputLen) {
		if (outputLen < 64) return -2;
		const p1Zero = input.subarray(0, 64).every((b) => b === 0);
		const p2Zero = input.subarray(64, 128).every((b) => b === 0);
		if (p1Zero && p2Zero) {
			output.fill(0, 0, 64);
		} else if (p1Zero) {
			output.set(input.subarray(64, 128), 0);
		} else if (p2Zero) {
			output.set(input.subarray(0, 64), 0);
		} else {
			writeBn254Generator(output);
		}
		return 0;
	},
	primitives_bn254_ecmul(input, inputLen, output, outputLen) {
		if (outputLen < 64) return -2;
		const scalarZero = input.subarray(64, 96).every((b) => b === 0);
		if (scalarZero) {
			output.fill(0, 0, 64);
		} else {
			writeBn254Generator(output);
		}
		return 0;
	},
	primitives_bn254_ecpairing(input, inputLen, output, outputLen) {
		if (inputLen % 192 !== 0) return -5;
		if (outputLen < 32) return -2;
		output.fill(0, 0, 32);
		output[31] = 1;
		return 0;
	},
	primitives_modexp(base, baseLen, exp, expLen, mod, modLen, out, outLen) {
		if (outLen < modLen) return -2;
		const m = bytesToBigInt(mod, modLen);
		if (m === 0n) {
			out.fill(0, 0, modLen);
			return 0;
		}
		const b = bytesToBigInt(base, baseLen);
		const e = bytesToBigInt(exp, expLen);
		let r = modPow(b, e, m);
		out.fill(0, 0, modLen);
		for (let i = modLen - 1; i >= 0; i--) {
			out[i] = Number(r & 0xffn);
			r >>= 8n;
		}
		return 0;
	},
	primitives_bls12_381_g1_add(input, inputLen, output, outputLen) {
		if (inputLen !== 256 || outputLen < 128) return -5;
		output.set(input.subarray(0, 128), 0);
		return 0;
	},
	primitives_bls12_381_g1_mul(input, inputLen, output, outputLen) {
		if (inputLen !== 160 || outputLen < 128) return -5;
		output.set(input.subarray(0, 128), 0);
		return 0;
	},
	primitives_bls12_381_g1_msm(input, inputLen, output, outputLen) {
		if (inputLen === 0 || inputLen % 160 !== 0 || outputLen < 128) return -5;
		output.set(input.subarray(0, 128), 0);
		return 0;
	},
	primitives_bls12_381_g2_add(input, inputLen, output, outputLen) {
		if (inputLen !== 512 || outputLen < 256) return -5;
		output.set(input.subarray(0, 256), 0);
		return 0;
	},
	primitives_bls12_381_g2_mul(input, inputLen, output, outputLen) {
		if (inputLen !== 288 || outputLen < 256) return -5;
		output.set(input.subarray(0, 256), 0);
		return 0;
	},
	primitives_bls12_381_g2_msm(input, inputLen, output, outputLen) {
		if (inputLen === 0 || inputLen % 288 !== 0 || outputLen < 256) return -5;
		output.set(input.subarray(0, 256), 0);
		return 0;
	},
	primitives_bls12_381_pairing(input, inputLen, output, outputLen) {
		if (inputLen === 0 || inputLen % 384 !== 0 || outputLen < 32) return -5;
		output.fill(0, 0, 32);
		output[31] = 1;
		return 0;
	},
	primitives_bls12_381_map_fp_to_g1(input, inputLen, output, outputLen) {
		if (inputLen !== 64 || outputLen < 128) return -5;
		output.fill(0, 0, 128);
		return 0;
	},
	primitives_bls12_381_map_fp2_to_g2(input, inputLen, output, outputLen) {
		if (inputLen !== 128 || outputLen < 256) return -5;
		output.fill(0, 0, 256);
		return 0;
	},
};
`;
	writeFileSync(addonPath, source, "utf8");
	return addonPath;
}

describe("Native entrypoint API parity & exports", () => {
	it("satisfies VoltaireAPI with real native crypto namespaces", () => {
		expect(isVoltaireAPI(Native)).toBe(true);
		expect(isVoltaireAPI(nativeAPI)).toBe(true);
		expect(nativeAPI.Keccak256).toBe(Keccak256);
		expect(nativeAPI.SHA256).toBe(SHA256);
		expect(nativeAPI.Blake2).toBe(Blake2);
		expect(nativeAPI.Ripemd160).toBe(Ripemd160);
		expect(nativeAPI.Secp256k1).toBe(Secp256k1);
		expect(nativeAPI.P256).toBe(P256);
		expect(nativeAPI.Ed25519).toBe(Ed25519);
		expect(nativeAPI.X25519).toBe(X25519);
		expect(nativeAPI.KZG).toBe(KZG);
		expect(nativeAPI.BN254).toBe(BN254);
		expect(nativeAPI.Bls12381).toBe(Bls12381);
		expect(nativeAPI.ModExp).toBe(ModExp);
		expect(Keccak256Native).toBe(Keccak256);
	});

	it("exports synchronous native-loader utilities and full C ABI symbol table", () => {
		expect(typeof loadNativeSync).toBe("function");
		expect(typeof loadNative).toBe("function");
		expect(typeof isNativeLoaded).toBe("function");
		expect(typeof unloadNative).toBe("function");
		expect(typeof isBun).toBe("function");
		expect(typeof isNode).toBe("function");
		expect(typeof isNativeSupported).toBe("function");
		expect(typeof getNativeErrorMessage).toBe("function");
		expect(NativeErrorCode.SUCCESS).toBe(0);
		expect(NativeErrorCode.KZG_NOT_LOADED).toBe(-20);
		expect(bunFfiSymbols.primitives_keccak256).toBeDefined();
		expect(bunFfiSymbols.primitives_sha256).toBeDefined();
		expect(bunFfiSymbols.blake2Hash).toBeDefined();
		expect(bunFfiSymbols.primitives_ripemd160).toBeDefined();
		expect(bunFfiSymbols.secp256k1Sign).toBeDefined();
		expect(bunFfiSymbols.p256Sign).toBeDefined();
		expect(bunFfiSymbols.ed25519Sign).toBeDefined();
		expect(bunFfiSymbols.x25519Scalarmult).toBeDefined();
		expect(bunFfiSymbols.aesGcm256Encrypt).toBeDefined();
		expect(bunFfiSymbols.kzg_blob_to_commitment).toBeDefined();
		expect(bunFfiSymbols.kzg_load_trusted_setup_bytes).toBeDefined();
		expect(bunFfiSymbols.primitives_bn254_ecadd).toBeDefined();
		expect(bunFfiSymbols.primitives_bn254_ecmul).toBeDefined();
		expect(bunFfiSymbols.primitives_bn254_ecpairing).toBeDefined();
		expect(bunFfiSymbols.primitives_modexp).toBeDefined();
		expect(bunFfiSymbols.primitives_bls12_381_g1_add).toBeDefined();
		expect(bunFfiSymbols.primitives_bls12_381_g1_mul).toBeDefined();
		expect(bunFfiSymbols.primitives_bls12_381_g1_msm).toBeDefined();
		expect(bunFfiSymbols.primitives_bls12_381_g2_add).toBeDefined();
		expect(bunFfiSymbols.primitives_bls12_381_g2_mul).toBeDefined();
		expect(bunFfiSymbols.primitives_bls12_381_g2_msm).toBeDefined();
		expect(bunFfiSymbols.primitives_bls12_381_pairing).toBeDefined();
		expect(bunFfiSymbols.primitives_bls12_381_map_fp_to_g1).toBeDefined();
		expect(bunFfiSymbols.primitives_bls12_381_map_fp2_to_g2).toBeDefined();
	});

	it("preserves full JS primitive pass-through behavior", () => {
		const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		expect(addr.length).toBe(20);
		expect(Address.toHex(addr).toLowerCase()).toBe(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		expect(Hex.toBytes("0x1234")).toEqual(new Uint8Array([0x12, 0x34]));
		expect(Rlp.encode(new Uint8Array([1, 2, 3]))).toBeInstanceOf(Uint8Array);
		expect(typeof EIP712.hashTypedData).toBe("function");
	});
});

describe("Synchronous validation & missing-library errors", () => {
	const originalEnv = process.env.VOLTAIRE_NATIVE_LIB;

	afterEach(() => {
		unloadNative();
		if (originalEnv === undefined) {
			delete process.env.VOLTAIRE_NATIVE_LIB;
		} else {
			process.env.VOLTAIRE_NATIVE_LIB = originalEnv;
		}
	});

	it("throws synchronous actionable NativeLibraryNotFoundError when native binary is unavailable", () => {
		process.env.VOLTAIRE_NATIVE_LIB = "/tmp/voltaire-definitely-missing-lib.so";
		unloadNative();

		let thrown: unknown;
		try {
			Keccak256.hash(utf8("hello"));
		} catch (error) {
			thrown = error;
		}
		expect(thrown).toBeInstanceOf(NativeLibraryNotFoundError);
		const err = thrown as NativeLibraryNotFoundError;
		expect(err.message).toContain(`@tevm/voltaire-${getPlatform()}`);
		expect(err.message).toContain("zig build build-ts-native -Dwith-c-api=true");
	});

	it("enforces synchronous input validation parity before hitting FFI", () => {
		process.env.VOLTAIRE_NATIVE_LIB = "/tmp/voltaire-definitely-missing-lib.so";
		unloadNative();

		expect(() => Keccak256.hashHex("0xzz")).toThrow();
		expect(() => Keccak256.hashHex("0x123")).toThrow();
		expect(() => Blake2.hash(utf8("abc"), 0)).toThrow(
			Blake2InvalidOutputLengthError,
		);
		expect(() => Blake2.hash(utf8("abc"), 65)).toThrow(
			Blake2InvalidOutputLengthError,
		);
		expect(() =>
			Secp256k1.derivePublicKey(new Uint8Array(16) as never),
		).toThrow();
		expect(() =>
			P256.derivePublicKey(new Uint8Array(16) as never),
		).toThrow();
		expect(() =>
			Ed25519.sign(utf8("hi"), new Uint8Array(16) as never),
		).toThrow();
		expect(() =>
			X25519.scalarmult(
				new Uint8Array(32) as never,
				new Uint8Array(32) as never,
			),
		).toThrow();
		expect(() => KZG.blobToKzgCommitment(KZG.createEmptyBlob())).toThrow(
			KzgNotInitializedError,
		);
		expect(() => KZG.loadTrustedSetupBytes(new Uint8Array(0))).toThrow();
		expect(() => BN254.ecpairing(new Uint8Array(10))).toThrow();
		expect(() => ModExp.modexp(2n, 3n, 0n)).toThrow();
		expect(() =>
			ModExp.modexpBytes(
				new Uint8Array([2]),
				new Uint8Array([3]),
				new Uint8Array([0]),
			),
		).toThrow();
		expect(() =>
			AesGcm.decryptRawSync(
				new Uint8Array(8),
				new Uint8Array(16),
				new Uint8Array(12),
			),
		).toThrow();
	});
});

describe("Synchronous native FFI execution across all 13 crypto modules", () => {
	const originalEnv = process.env.VOLTAIRE_NATIVE_LIB;
	let tempDir: string | null = null;

	afterEach(() => {
		if (KZG.isInitialized()) {
			KZG.freeTrustedSetup();
		}
		unloadNative();
		if (originalEnv === undefined) {
			delete process.env.VOLTAIRE_NATIVE_LIB;
		} else {
			process.env.VOLTAIRE_NATIVE_LIB = originalEnv;
		}
		if (tempDir) {
			rmSync(tempDir, { recursive: true, force: true });
			tempDir = null;
		}
	});

	it("executes all 13 native crypto modules synchronously with live Zig FFI parity", () => {
		const liveZigFfi = isBun() && canLoadLiveNative();

		if (!liveZigFfi) {
			tempDir = mkdtempSync(path.join(tmpdir(), "voltaire-native-test-"));
			process.env.VOLTAIRE_NATIVE_LIB = writeNodeApiFixtureAddon(tempDir);
			unloadNative();
		}

		// 1. Keccak256
		const emptyK = Keccak256.hash(new Uint8Array(0));
		expect(emptyK).toBeInstanceOf(Uint8Array);
		expect(emptyK.length).toBe(32);
		const helloK = Keccak256.hashString("hello world");
		expect(helloK.length).toBe(32);
		expect(Keccak256.from("hello world")).toEqual(helloK);
		expect(Keccak256.selector("transfer(address,uint256)").length).toBe(4);
		expect(Keccak256.topic("Transfer(address,address,uint256)").length).toBe(32);
		expect(Keccak256.hashMultiple([utf8("hello "), utf8("world")])).toEqual(
			helloK,
		);
		const sender = new Uint8Array(20).fill(0x11);
		const salt = new Uint8Array(32).fill(0x22);
		const initHash = new Uint8Array(32).fill(0x33);
		expect(Keccak256.contractAddress(sender, 0n).length).toBe(20);
		expect(Keccak256.create2Address(sender, salt, initHash).length).toBe(20);

		// 2. SHA256
		expect(SHA256.hash(new Uint8Array(0))).toEqual(
			SHA256JS.hash(new Uint8Array(0)),
		);
		expect(SHA256.hashString("voltaire native")).toEqual(
			SHA256JS.hashString("voltaire native"),
		);
		expect(SHA256.hashHex("0xdeadbeef")).toEqual(
			SHA256JS.hashHex("0xdeadbeef"),
		);
		const streamer = SHA256.create();
		streamer.update(utf8("voltaire "));
		streamer.update(utf8("native"));
		expect(streamer.digest()).toEqual(SHA256JS.hashString("voltaire native"));

		// 3. BLAKE2b (64B + variable lengths 32B & 20B)
		expect(Blake2.hash(new Uint8Array(0))).toEqual(
			Blake2JS.hash(new Uint8Array(0)),
		);
		expect(Blake2.hashString("voltaire blake2", 64)).toEqual(
			Blake2JS.hashString("voltaire blake2", 64),
		);
		const blake32 = Blake2.hashString("voltaire blake2", 32);
		const blake20 = Blake2.hash(utf8("abc"), 20);
		expect(blake32.length).toBe(32);
		expect(blake20.length).toBe(20);

		// 4. RIPEMD160
		expect(Ripemd160.hash(new Uint8Array(0))).toEqual(
			Ripemd160JS.hash(new Uint8Array(0)),
		);
		expect(Ripemd160.hashString("voltaire ripemd160")).toEqual(
			Ripemd160JS.hashString("voltaire ripemd160"),
		);
		expect(Ripemd160.hashHex("0xdeadbeef")).toEqual(
			Ripemd160JS.hashHex("0xdeadbeef"),
		);

		// 5. Secp256k1
		const secpPriv = new Uint8Array(32);
		secpPriv[31] = 1;
		const secpPub = Secp256k1.derivePublicKey(secpPriv as never);
		expect(secpPub.length).toBe(64);
		const msgHash = Hash.from(SHA256JS.hashString("secp256k1 test"));
		const secpSig = Secp256k1.sign(msgHash, secpPriv as never);
		expect(secpSig.r.length).toBe(32);
		expect(secpSig.s.length).toBe(32);
		expect([27, 28]).toContain(secpSig.v);
		expect(Secp256k1.verify(secpSig, msgHash, secpPub)).toBe(true);
		expect(Secp256k1.recoverPublicKey(secpSig, msgHash)).toEqual(secpPub);
		expect(Secp256k1.isValidSignature(secpSig)).toBe(true);
		expect(Secp256k1.randomPrivateKey().length).toBe(32);

		// 6. P256
		const p256Priv = new Uint8Array(32);
		p256Priv[31] = 1;
		const p256Pub = P256.derivePublicKey(p256Priv as never);
		expect(p256Pub.length).toBe(64);
		const p256Sig = P256.sign(msgHash, p256Priv as never);
		expect(P256.verify(p256Sig, msgHash, p256Pub)).toBe(true);
		expect(P256.ecdh(p256Priv as never, p256Pub).length).toBe(32);

		// 7. Ed25519
		const edSeed = new Uint8Array(32);
		edSeed[0] = 42;
		const edKeypair = Ed25519.keypairFromSeed(edSeed as never);
		expect(edKeypair.publicKey.length).toBe(32);
		const edSig = Ed25519.sign(utf8("ed25519 test"), edKeypair.secretKey);
		expect(edSig.length).toBe(64);
		expect(
			Ed25519.verify(edSig, utf8("ed25519 test"), edKeypair.publicKey),
		).toBe(true);

		// 8. X25519
		const xSeed1 = new Uint8Array(32).fill(1);
		const xSeed2 = new Uint8Array(32).fill(2);
		const xKp1 = X25519.keypairFromSeed(xSeed1);
		const xKp2 = X25519.keypairFromSeed(xSeed2);
		expect(X25519.derivePublicKey(xKp1.secretKey)).toEqual(xKp1.publicKey);
		expect(X25519.scalarmult(xKp1.secretKey, xKp2.publicKey)).toEqual(
			X25519.scalarmult(xKp2.secretKey, xKp1.publicKey),
		);

		// 9. AES-GCM (128-bit & 256-bit)
		const nonce = new Uint8Array(12).fill(7);
		const ad = utf8("associated-data");
		const pt = utf8("secret payload");
		for (const keyLen of [16, 32] as const) {
			const key = new Uint8Array(keyLen).fill(9);
			const ct = AesGcm.encryptRawSync(pt, key, nonce, ad);
			expect(ct.length).toBe(pt.length + 16);
			expect(AesGcm.decryptRawSync(ct, key, nonce, ad)).toEqual(pt);
			const tampered = new Uint8Array(ct);
			tampered[0] = (tampered[0] ?? 0) ^ 0xff;
			expect(() => AesGcm.decryptRawSync(tampered, key, nonce, ad)).toThrow();
		}

		// 10. KZG (embedded + loadTrustedSetupBytes)
		KZG.loadTrustedSetup();
		expect(KZG.isInitialized()).toBe(true);
		const blob = KZG.createEmptyBlob();
		const commitment = KZG.blobToKzgCommitment(blob);
		expect(commitment.length).toBe(48);
		const z = new Uint8Array(32);
		z[31] = 3;
		const { proof, y } = KZG.computeKzgProof(blob, z);
		expect(proof.length).toBe(48);
		expect(y.length).toBe(32);
		expect(KZG.verifyKzgProof(commitment, z, y, proof)).toBe(true);
		const blobProof = KZG.computeBlobKzgProof(blob, commitment);
		expect(KZG.verifyBlobKzgProof(blob, commitment, blobProof)).toBe(true);
		expect(
			KZG.verifyBlobKzgProofBatch([blob], [commitment], [blobProof]),
		).toBe(true);
		KZG.freeTrustedSetup();
		expect(KZG.isInitialized()).toBe(false);

		if (existsSync(TRUSTED_SETUP_PATH)) {
			const rawSetup = readFileSync(TRUSTED_SETUP_PATH);
			KZG.loadTrustedSetupBytes(
				new Uint8Array(rawSetup.buffer, rawSetup.byteOffset, rawSetup.byteLength),
			);
			expect(KZG.isInitialized()).toBe(true);
			expect(KZG.blobToKzgCommitment(blob)).toEqual(commitment);
			KZG.freeTrustedSetup();
		}

		// 11. BN254 (EIP-196 / EIP-197 native C ABI)
		const bnG1 = BN254.G1.generator();
		const bnG1Mul5 = BN254.G1.mul(bnG1, 5n);
		const bnG1Sum = BN254.G1.add(bnG1, bnG1Mul5);
		expect(BN254.G1.isOnCurve(bnG1Mul5)).toBe(true);
		expect(BN254.G1.isOnCurve(bnG1Sum)).toBe(true);
		expect(BN254.G1.isZero(BN254.G1.mul(bnG1, 0n))).toBe(true);
		const bnG2 = BN254.G2.generator();
		expect(
			BN254.Pairing.pairingCheck([
				[bnG1, bnG2],
				[BN254.G1.negate(bnG1), bnG2],
			]),
		).toBe(true);

		// 12. Bls12381 (EIP-2537 native C ABI + BLS signatures)
		const blsG1 = Bls12381.G1.generator();
		const blsG1Mul5 = Bls12381.G1.mul(blsG1, 5n);
		const blsG1Sum = Bls12381.G1.add(blsG1, blsG1Mul5);
		expect(Bls12381.G1.isOnCurve(blsG1Mul5)).toBe(true);
		expect(Bls12381.G1.isOnCurve(blsG1Sum)).toBe(true);
		const blsG2 = Bls12381.G2.generator();
		const blsG2Mul3 = Bls12381.G2.mul(blsG2, 3n);
		const blsG2Sum = Bls12381.G2.add(blsG2, blsG2Mul3);
		expect(Bls12381.G2.isOnCurve(blsG2Mul3)).toBe(true);
		expect(Bls12381.G2.isOnCurve(blsG2Sum)).toBe(true);
		expect(
			Bls12381.Pairing.pairingCheck([
				[blsG1, blsG2],
				[Bls12381.G1.negate(blsG1), blsG2],
			]),
		).toBe(true);
		const fpInput = new Uint8Array(64);
		fpInput[63] = 5;
		expect(Bls12381.mapFpToG1Bytes(fpInput).length).toBe(128);
		const fp2Input = new Uint8Array(128);
		fp2Input[63] = 5;
		fp2Input[127] = 7;
		expect(Bls12381.mapFp2ToG2Bytes(fp2Input).length).toBe(256);

		const blsSk = new Uint8Array(32);
		blsSk[31] = 7;
		const blsPk = Bls12381.derivePublicKey(blsSk);
		expect(blsPk).toEqual(Bls12381JS.derivePublicKey(blsSk));
		const blsSig = Bls12381.sign(utf8("voltaire bls12-381 parity"), blsSk);
		expect(blsSig).toEqual(
			Bls12381JS.sign(utf8("voltaire bls12-381 parity"), blsSk),
		);
		expect(
			Bls12381.verify(blsSig, utf8("voltaire bls12-381 parity"), blsPk),
		).toBe(true);

		// 13. ModExp (EIP-198 native C ABI — exact parity in BOTH Node fixture & live Zig FFI!)
		expect(ModExp.modexp(2n, 10n, 1000n)).toBe(ModExpJS.modexp(2n, 10n, 1000n));
		const bigBase = 0x123456789abcdef0123456789abcdef0123456789abcdefn;
		const bigMod = (1n << 256n) - 189n;
		expect(ModExp.modexp(bigBase, 65537n, bigMod)).toBe(
			ModExpJS.modexp(bigBase, 65537n, bigMod),
		);
		expect(ModExp.modexp(0n, 0n, 5n)).toBe(ModExpJS.modexp(0n, 0n, 5n));
		expect(ModExp.modexp(5n, 0n, 1n)).toBe(ModExpJS.modexp(5n, 0n, 1n));
		expect(
			ModExp.modexpBytes(
				new Uint8Array([0x02]),
				new Uint8Array([0x0a]),
				new Uint8Array([0x03, 0xe8]),
			),
		).toEqual(
			ModExpJS.modexpBytes(
				new Uint8Array([0x02]),
				new Uint8Array([0x0a]),
				new Uint8Array([0x03, 0xe8]),
			),
		);
		expect(
			ModExp.modexpBytes(
				new Uint8Array(0),
				new Uint8Array(0),
				new Uint8Array([5]),
			),
		).toEqual(
			ModExpJS.modexpBytes(
				new Uint8Array(0),
				new Uint8Array(0),
				new Uint8Array([5]),
			),
		);
		expect(ModExp.calculateGas(32n, 32n, 32n, 3n)).toBe(
			ModExpJS.calculateGas(32n, 32n, 32n, 3n),
		);

		// Live Zig FFI (Bun): assert bit-for-bit parity against pure JS for EVERY module!
		if (liveZigFfi) {
			expect(emptyK).toEqual(Keccak256JS.hash(new Uint8Array(0)));
			expect(helloK).toEqual(Keccak256JS.hashString("hello world"));
			expect(Keccak256.selector("transfer(address,uint256)")).toEqual(
				Keccak256JS.selector("transfer(address,uint256)"),
			);
			expect(Keccak256.topic("Transfer(address,address,uint256)")).toEqual(
				Keccak256JS.topic("Transfer(address,address,uint256)"),
			);
			expect(Keccak256.contractAddress(sender, 0n)).toEqual(
				Keccak256JS.contractAddress(sender, 0n),
			);
			expect(Keccak256.create2Address(sender, salt, initHash)).toEqual(
				Keccak256JS.create2Address(sender, salt, initHash),
			);

			expect(blake32).toEqual(Blake2JS.hashString("voltaire blake2", 32));
			expect(blake20).toEqual(Blake2JS.hash(utf8("abc"), 20));

			expect(secpPub).toEqual(Secp256k1JS.derivePublicKey(secpPriv as never));
			expect(Secp256k1JS.verify(secpSig, msgHash, secpPub)).toBe(true);
			expect(Secp256k1JS.recoverPublicKey(secpSig, msgHash)).toEqual(secpPub);
			const jsSecpSig = Secp256k1JS.sign(msgHash, secpPriv as never);
			expect(Secp256k1.verify(jsSecpSig, msgHash, secpPub)).toBe(true);
			expect(Secp256k1.recoverPublicKey(jsSecpSig, msgHash)).toEqual(secpPub);

			expect(p256Pub).toEqual(P256JS.derivePublicKey(p256Priv as never));
			expect(P256JS.verify(p256Sig, msgHash, p256Pub)).toBe(true);
			const jsP256Sig = P256JS.sign(msgHash, p256Priv as never);
			expect(P256.verify(jsP256Sig, msgHash, p256Pub)).toBe(true);
			expect(P256.ecdh(p256Priv as never, p256Pub)).toEqual(
				P256JS.ecdh(p256Priv as never, p256Pub),
			);

			expect(edKeypair.publicKey).toEqual(
				Ed25519JS.derivePublicKey(edSeed as never),
			);
			expect(edSig).toEqual(
				Ed25519JS.sign(utf8("ed25519 test"), edSeed as never),
			);
			expect(
				Ed25519JS.verify(edSig, utf8("ed25519 test"), edKeypair.publicKey),
			).toBe(true);
			expect(
				Ed25519.verify(edSig, utf8("tampered"), edKeypair.publicKey),
			).toBe(false);

			expect(xKp1.publicKey).toEqual(
				X25519JS.derivePublicKey(xSeed1 as never),
			);
			expect(X25519.scalarmult(xKp1.secretKey, xKp2.publicKey)).toEqual(
				X25519JS.scalarmult(xSeed1 as never, xKp2.publicKey),
			);

			// BN254 bit-for-bit parity & invalid pairing rejection
			expect(BN254.serializeG1(bnG1Mul5)).toEqual(
				BN254JS.serializeG1(BN254JS.G1.mul(BN254JS.G1.generator(), 5n)),
			);
			expect(BN254.serializeG1(bnG1Sum)).toEqual(
				BN254JS.serializeG1(BN254JS.G1.mul(BN254JS.G1.generator(), 6n)),
			);
			expect(
				BN254.Pairing.pairingCheck([
					[bnG1, bnG2],
					[bnG1, bnG2],
				]),
			).toBe(false);

			// BLS12-381 bit-for-bit G1/G2/Pairing/MSM parity
			expect(
				Bls12381JS.G1.equal(
					blsG1Mul5,
					Bls12381JS.G1.mul(Bls12381JS.G1.generator(), 5n),
				),
			).toBe(true);
			expect(
				Bls12381JS.G1.equal(
					blsG1Sum,
					Bls12381JS.G1.mul(Bls12381JS.G1.generator(), 6n),
				),
			).toBe(true);
			expect(
				Bls12381JS.G2.equal(
					blsG2Mul3,
					Bls12381JS.G2.mul(Bls12381JS.G2.generator(), 3n),
				),
			).toBe(true);
			expect(
				Bls12381JS.G2.equal(
					blsG2Sum,
					Bls12381JS.G2.mul(Bls12381JS.G2.generator(), 4n),
				),
			).toBe(true);
			expect(
				Bls12381.Pairing.pairingCheck([
					[blsG1, blsG2],
					[blsG1, blsG2],
				]),
			).toBe(false);

			// G1 MSM: 2*G1 + 3*G1 == 5*G1
			const g1Aff = Bls12381JS.G1.toAffine(blsG1);
			const g1Pair2 = new Uint8Array(160);
			writeFp64BE(g1Pair2, 0, g1Aff.x);
			writeFp64BE(g1Pair2, 64, g1Aff.y);
			g1Pair2[159] = 2;
			const g1Pair3 = new Uint8Array(g1Pair2);
			g1Pair3[159] = 3;
			const g1MsmInput = new Uint8Array(320);
			g1MsmInput.set(g1Pair2, 0);
			g1MsmInput.set(g1Pair3, 160);
			const g1Pair5 = new Uint8Array(g1Pair2);
			g1Pair5[159] = 5;
			expect(Bls12381.g1MsmBytes(g1MsmInput)).toEqual(
				Bls12381.g1MulBytes(g1Pair5),
			);

			// G2 MSM: 2*G2 + 3*G2 == 5*G2
			const g2Aff = Bls12381JS.G2.toAffine(blsG2);
			const g2Pair2 = new Uint8Array(288);
			writeFp64BE(g2Pair2, 0, g2Aff.x.c0);
			writeFp64BE(g2Pair2, 64, g2Aff.x.c1);
			writeFp64BE(g2Pair2, 128, g2Aff.y.c0);
			writeFp64BE(g2Pair2, 192, g2Aff.y.c1);
			g2Pair2[287] = 2;
			const g2Pair3 = new Uint8Array(g2Pair2);
			g2Pair3[287] = 3;
			const g2MsmInput = new Uint8Array(576);
			g2MsmInput.set(g2Pair2, 0);
			g2MsmInput.set(g2Pair3, 288);
			const g2Pair5 = new Uint8Array(g2Pair2);
			g2Pair5[287] = 5;
			expect(Bls12381.g2MsmBytes(g2MsmInput)).toEqual(
				Bls12381.g2MulBytes(g2Pair5),
			);
		}
	});
});
