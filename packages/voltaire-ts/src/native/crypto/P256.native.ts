/**
 * P256 (secp256r1) synchronous native implementation using Zig C ABI (Bun FFI / Node-API).
 * Drop-in 1:1 replacement for pure JS P256.
 */

import {
	CURVE_B,
	CURVE_ORDER,
	FIELD_PRIME,
	PRIVATE_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SHARED_SECRET_SIZE,
	SIGNATURE_COMPONENT_SIZE,
} from "../../crypto/P256/constants.js";
import {
	InvalidPrivateKeyError,
	InvalidPublicKeyError,
	P256Error,
} from "../../crypto/P256/errors.js";
import { P256 as P256JS } from "../../crypto/P256/index.js";
import { isValidPublicKey } from "../../crypto/P256/isValidPublicKey.js";
import type { P256Constructor } from "../../crypto/P256/P256Constructor.js";
import type { P256PrivateKeyType } from "../../crypto/P256/P256PrivateKeyType.js";
import type { P256PublicKeyType } from "../../crypto/P256/P256PublicKeyType.js";
import type { P256SignatureType } from "../../crypto/P256/P256SignatureType.js";
import { randomPrivateKey } from "../../crypto/P256/randomPrivateKey.js";
import { validatePrivateKey } from "../../crypto/P256/validatePrivateKey.js";
import { validatePublicKey } from "../../crypto/P256/validatePublicKey.js";
import type { SHA256Hash } from "../../crypto/SHA256/SHA256HashType.js";
import {
	allocateOutput,
	loadNativeSync,
} from "../../native-loader/index.js";
import { Hash, type HashType } from "../../primitives/Hash/index.js";

export interface P256SignOptions {
	extraEntropy?: boolean | Uint8Array;
	lowS?: boolean;
}

/**
 * Sign a 32-byte message hash with a 32-byte P-256 private key via native Zig FFI.
 */
export function sign(
	messageHash: HashType | SHA256Hash | Uint8Array,
	privateKey: P256PrivateKeyType,
	options?: P256SignOptions,
): P256SignatureType {
	if (privateKey.length !== PRIVATE_KEY_SIZE) {
		throw new InvalidPrivateKeyError(
			`Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
		);
	}
	if (!validatePrivateKey(privateKey)) {
		throw new InvalidPrivateKeyError("Private key must be in range [1, n-1]");
	}
	if (options?.extraEntropy !== undefined || options?.lowS === false) {
		return P256JS.sign(messageHash, privateKey, options);
	}
	if (messageHash.length !== 32) {
		throw new P256Error(
			`Message hash must be 32 bytes, got ${messageHash.length}`,
		);
	}

	const lib = loadNativeSync();
	const outSig = allocateOutput(64);
	const code = lib.p256Sign(messageHash, privateKey, outSig);
	if (code !== 0) {
		throw new P256Error(`Native P256 signing failed (code ${code})`);
	}

	return {
		r: Hash.from(outSig.slice(0, 32)),
		s: Hash.from(outSig.slice(32, 64)),
	};
}

/**
 * Verify a P-256 ECDSA signature over a 32-byte message hash via native Zig FFI.
 */
export function verify(
	signature: P256SignatureType,
	messageHash: HashType | SHA256Hash | Uint8Array,
	publicKey: P256PublicKeyType,
): boolean {
	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		throw new InvalidPublicKeyError(
			`Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
		);
	}
	if (
		messageHash.length !== 32 ||
		signature.r.length !== SIGNATURE_COMPONENT_SIZE ||
		signature.s.length !== SIGNATURE_COMPONENT_SIZE
	) {
		return false;
	}
	if (!validatePublicKey(publicKey)) {
		return false;
	}

	const compactSig = new Uint8Array(64);
	compactSig.set(signature.r, 0);
	compactSig.set(signature.s, 32);

	const lib = loadNativeSync();
	// p256Verify returns 0 if valid, 1 if invalid, negative on error
	return lib.p256Verify(messageHash, compactSig, publicKey) === 0;
}

/**
 * Derive 64-byte uncompressed P-256 public key from 32-byte private key via native Zig FFI.
 */
export function derivePublicKey(
	privateKey: P256PrivateKeyType,
): P256PublicKeyType {
	if (privateKey.length !== PRIVATE_KEY_SIZE) {
		throw new InvalidPrivateKeyError(
			`Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
		);
	}
	if (!validatePrivateKey(privateKey)) {
		throw new InvalidPrivateKeyError("Private key must be in range [1, n-1]");
	}

	const lib = loadNativeSync();
	const outPub = allocateOutput(PUBLIC_KEY_SIZE);
	const code = lib.p256DerivePublicKey(privateKey, outPub);
	if (code !== 0) {
		throw new InvalidPrivateKeyError(
			`Native P256 public key derivation failed (code ${code})`,
		);
	}
	return outPub as P256PublicKeyType;
}

/**
 * Perform P-256 ECDH shared secret computation via native Zig FFI.
 */
export function ecdh(
	privateKey: P256PrivateKeyType,
	publicKey: P256PublicKeyType,
): Uint8Array {
	if (privateKey.length !== PRIVATE_KEY_SIZE) {
		throw new InvalidPrivateKeyError(
			`Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
		);
	}
	if (!validatePrivateKey(privateKey)) {
		throw new InvalidPrivateKeyError("Private key must be in range [1, n-1]");
	}
	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		throw new InvalidPublicKeyError(
			`Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
		);
	}
	if (!validatePublicKey(publicKey)) {
		throw new InvalidPublicKeyError(
			"Public key is not a valid point on the P256 curve",
		);
	}

	const lib = loadNativeSync();
	const outShared = allocateOutput(SHARED_SECRET_SIZE);
	const code = lib.p256Ecdh(privateKey, publicKey, outShared);
	if (code !== 0) {
		throw new P256Error(`Native P256 ECDH failed (code ${code})`);
	}
	return outShared;
}

export {
	CURVE_B,
	CURVE_ORDER,
	FIELD_PRIME,
	isValidPublicKey,
	PRIVATE_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	randomPrivateKey,
	SHARED_SECRET_SIZE,
	SIGNATURE_COMPONENT_SIZE,
	validatePrivateKey,
	validatePublicKey,
};

export const P256: P256Constructor = {
	sign,
	verify,
	derivePublicKey,
	ecdh,
	randomPrivateKey,
	validatePrivateKey,
	validatePublicKey,
	isValidPublicKey,
	CURVE_ORDER,
	FIELD_PRIME,
	CURVE_B,
	PRIVATE_KEY_SIZE,
	PUBLIC_KEY_SIZE,
	SIGNATURE_COMPONENT_SIZE,
	SHARED_SECRET_SIZE,
} satisfies typeof P256JS;
