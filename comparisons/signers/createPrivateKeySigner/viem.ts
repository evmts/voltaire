import { privateKeyToAccount } from "viem/accounts";

const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

export function main(): void {
	privateKeyToAccount(testPrivateKey);
}
