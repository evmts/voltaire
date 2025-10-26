import { secp256k1PubkeyFromPrivate } from "../../../src/typescript/native/primitives/signature.native";
import { Hash } from "../../../src/typescript/native/primitives/keccak.native";

// Test private key - DO NOT use in production
const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

export function main(): string {
	// Get uncompressed public key (64 bytes)
	const privateKeyBytes = Buffer.from(testPrivateKey.slice(2), "hex");
	const publicKeyBytes = secp256k1PubkeyFromPrivate(privateKeyBytes);

	// Hash the public key
	const hash = Hash.keccak256(publicKeyBytes);

	// Take last 20 bytes as address
	const addressBytes = hash.toBytes().slice(-20);
	return `0x${Buffer.from(addressBytes).toString("hex")}`;
}
