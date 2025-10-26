import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

// Test private key - DO NOT use in production
const testPrivateKey: Hex =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

export function main(): string {
	const account = privateKeyToAccount(testPrivateKey);
	return account.address;
}
