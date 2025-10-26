import { Wallet } from "ethers";

const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const wallet = new Wallet(testPrivateKey);

export function main(): void {
	wallet.address;
}
