/**
 * Extended cryptographic functions
 * SHA512, HMAC, PBKDF2, scrypt, ECDH
 */

export type Hex = `0x${string}`;

/**
 * Compute SHA2-512 hash
 */
export function sha512(data: Uint8Array): Uint8Array {
	throw new Error("not implemented");
}

/**
 * Compute HMAC with SHA256 or SHA512
 */
export function computeHmac(
	algorithm: "sha256" | "sha512",
	key: Uint8Array,
	data: Uint8Array,
): Uint8Array {
	throw new Error("not implemented");
}

/**
 * PBKDF2 key derivation (legacy)
 */
export function pbkdf2(
	password: Uint8Array,
	salt: Uint8Array,
	iterations: number,
	keylen: number,
	algo: "sha256" | "sha512",
): Uint8Array {
	throw new Error("not implemented");
}

/**
 * scrypt key derivation (async)
 */
export function scrypt(
	password: Uint8Array,
	salt: Uint8Array,
	N: number,
	r: number,
	p: number,
	keylen: number,
): Promise<Uint8Array> {
	throw new Error("not implemented");
}

/**
 * scrypt key derivation (sync)
 */
export function scryptSync(
	password: Uint8Array,
	salt: Uint8Array,
	N: number,
	r: number,
	p: number,
	keylen: number,
): Uint8Array {
	throw new Error("not implemented");
}

/**
 * Compute ECDH shared secret
 */
export function computeSharedSecret(
	privateKey: Hex,
	publicKey: Hex,
): Uint8Array {
	throw new Error("not implemented");
}

/**
 * Add elliptic curve points
 */
export function addPoints(p1: Hex, p2: Hex): Hex {
	throw new Error("not implemented");
}
