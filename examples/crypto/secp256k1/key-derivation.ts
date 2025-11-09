/**
 * Key derivation and address generation
 *
 * Demonstrates:
 * - Secure private key generation
 * - Public key derivation from private key
 * - Ethereum address derivation from public key
 * - Key validation
 * - One-way nature of derivation
 */

import * as Secp256k1 from "../../../src/crypto/Secp256k1/index.js";
import { keccak256 } from "../../../src/primitives/Hash/BrandedHash/keccak256.js";
const privateKey = new Uint8Array(32);
crypto.getRandomValues(privateKey); // Cryptographically secure random

// Validate private key
const isValidPrivate = Secp256k1.isValidPrivateKey(privateKey);
const publicKey = Secp256k1.derivePublicKey(privateKey);

// Validate public key
const isValidPublic = Secp256k1.isValidPublicKey(publicKey);

// Hash public key with Keccak256
const publicKeyHash = keccak256(publicKey);

// Take last 20 bytes as address
const addressBytes = publicKeyHash.slice(12);
const addressHex = `0x${Buffer.from(addressBytes).toString("hex")}`;
const publicKey2 = Secp256k1.derivePublicKey(privateKey);
const keysMatch = publicKey.every((byte, i) => byte === publicKey2[i]);

// Minimum valid private key (1)
const minKey = new Uint8Array(32);
minKey[31] = 1;
const minKeyValid = Secp256k1.isValidPrivateKey(minKey);

// Zero private key (invalid)
const zeroKey = new Uint8Array(32);
const zeroKeyValid = Secp256k1.isValidPrivateKey(zeroKey);

// Short key (invalid)
const shortKey = new Uint8Array(16);
const shortKeyValid = Secp256k1.isValidPrivateKey(shortKey);
for (let i = 0; i < 3; i++) {
	const pk = new Uint8Array(32);
	crypto.getRandomValues(pk);
	const pubKey = Secp256k1.derivePublicKey(pk);
	const hash = keccak256(pubKey);
	const addr = `0x${Buffer.from(hash.slice(12)).toString("hex")}`;
}
const privateKeyOne = new Uint8Array(32);
privateKeyOne[31] = 1;
const generatorPoint = Secp256k1.derivePublicKey(privateKeyOne);

// Expected generator point coordinates
const expectedGx = BigInt(
	"0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798",
);
const expectedGy = BigInt(
	"0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8",
);

const actualGx = BigInt(
	`0x${Buffer.from(generatorPoint.slice(0, 32)).toString("hex")}`,
);
const actualGy = BigInt(
	`0x${Buffer.from(generatorPoint.slice(32, 64)).toString("hex")}`,
);
