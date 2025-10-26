import { Wallet } from "ethers";

const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const wallet = new Wallet(testPrivateKey);

const testMessage = "Hello, Ethereum!";

export async function main(): Promise<void> {
	await wallet.signMessage(testMessage);
}
