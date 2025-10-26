import { Wallet } from "ethers";

const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

export function main(): void {
	new Wallet(testPrivateKey);
}
