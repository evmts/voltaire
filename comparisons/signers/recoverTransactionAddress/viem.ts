import { privateKeyToAccount } from "viem/accounts";
import { signTransaction, recoverTransactionAddress } from "viem";
import type { Hex } from "viem";

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

// Cache the signed transaction for benchmarking
let signedTx: Hex | null = null;

export async function main(): Promise<void> {
	// Sign transaction on first run only
	if (!signedTx) {
		signedTx = await signTransaction({
			account,
			transaction: testTransaction,
		});
	}
	await recoverTransactionAddress({
		serializedTransaction: signedTx,
	});
}
