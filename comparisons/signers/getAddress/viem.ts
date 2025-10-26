import { privateKeyToAccount } from "viem/accounts";

const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const account = privateKeyToAccount(testPrivateKey);

export function main(): void {
	account.address;
}
