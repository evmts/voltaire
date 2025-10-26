import { secp256k1 } from "@noble/curves/secp256k1.js";
import { keccak_256 } from "@noble/hashes/sha3.js";

// Test private key - DO NOT use in production
const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

export function main(): string {
	// Get uncompressed public key
	const privateKeyBytes = Buffer.from(testPrivateKey.slice(2), "hex");
	const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false);

	// Remove first byte (0x04) and hash the rest
	const publicKeyWithoutPrefix = publicKeyBytes.slice(1);
	const hash = keccak_256(publicKeyWithoutPrefix);

	// Take last 20 bytes as address
	return `0x${Buffer.from(hash.slice(-20)).toString("hex")}`;
}
