import { secp256k1 } from "@noble/curves/secp256k1.js";

// Test private key - DO NOT use in production
const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

export function main(): string {
	const privateKeyBytes = Buffer.from(testPrivateKey.slice(2), "hex");
	const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false);
	return `0x${Buffer.from(publicKeyBytes).toString("hex")}`;
}
