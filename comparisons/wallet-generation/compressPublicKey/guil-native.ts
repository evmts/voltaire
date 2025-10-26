import { compressPublicKey } from "../../../src/typescript/native/primitives/wallet.native";

// Test uncompressed public key derived from test private key
const testPublicKey =
	"0x044646ae5047316b4230d0086c8acec687f00b1cd9d1dc634f6cb358ac0a9a8ffffe77b4dd0a4bfb95851f3b7355c781dd60f8418fc8a65d14907aff47c903a559";

export function main(): string {
	// Remove 0x04 prefix (uncompressed marker) to get 64 bytes
	const publicKeyBytes = Buffer.from(testPublicKey.slice(4), "hex");
	const compressed = compressPublicKey(publicKeyBytes);
	return `0x${Buffer.from(compressed).toString("hex")}`;
}
