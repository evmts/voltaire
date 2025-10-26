import { privateKeyToAccount } from "viem/accounts";
import { signTransaction } from "viem/accounts";

const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const account = privateKeyToAccount(testPrivateKey);

const testTransaction = {
	to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const,
	value: 1000000000000000000n,
	chainId: 1,
	nonce: 0,
	maxFeePerGas: 20000000000n,
	maxPriorityFeePerGas: 1000000000n,
	gas: 21000n,
	data: "0x" as const,
};

export async function main(): Promise<void> {
	await signTransaction({
		account,
		transaction: testTransaction,
	});
}
