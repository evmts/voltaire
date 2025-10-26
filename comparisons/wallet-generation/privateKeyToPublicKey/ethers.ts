import { ethers } from "ethers";

// Test private key - DO NOT use in production
const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

export function main(): string {
	const signingKey = new ethers.SigningKey(testPrivateKey);
	return signingKey.publicKey;
}
