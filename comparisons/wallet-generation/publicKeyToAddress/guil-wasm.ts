import { Hash } from "../../../src/typescript/wasm/primitives/keccak.wasm";

// Test uncompressed public key derived from test private key
const testPublicKey =
	"0x044646ae5047316b4230d0086c8acec687f00b1cd9d1dc634f6cb358ac0a9a8ffffe77b4dd0a4bfb95851f3b7355c781dd60f8418fc8a65d14907aff47c903a559";

export function main(): string {
	// Remove 0x prefix and first byte (0x04 for uncompressed) to get 64 bytes
	const publicKeyBytes = new Uint8Array(Buffer.from(testPublicKey.slice(4), "hex"));
	const hash = Hash.keccak256(publicKeyBytes);
	// Take last 20 bytes
	const addressBytes = hash.toBytes().slice(-20);
	return `0x${Buffer.from(addressBytes).toString("hex")}`;
}
