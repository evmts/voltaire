import { publicKeyToAddress } from "viem/utils";
import type { Hex } from "viem";

// Test uncompressed public key derived from test private key
const testPublicKey: Hex =
	"0x044646ae5047316b4230d0086c8acec687f00b1cd9d1dc634f6cb358ac0a9a8ffffe77b4dd0a4bfb95851f3b7355c781dd60f8418fc8a65d14907aff47c903a559";

export function main(): string {
	return publicKeyToAddress(testPublicKey);
}
