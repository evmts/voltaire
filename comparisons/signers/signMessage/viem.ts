import { privateKeyToAccount } from "viem/accounts";

const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const account = privateKeyToAccount(testPrivateKey);

const testMessage = "Hello, Ethereum!";

export async function main(): Promise<void> {
	await account.signMessage({ message: testMessage });
}
