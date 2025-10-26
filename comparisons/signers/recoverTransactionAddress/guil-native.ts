import { PrivateKeySignerImpl } from "../../../src/typescript/native/crypto/signers/private-key-signer.js";
import { recoverTransactionAddress } from "../../../src/typescript/native/crypto/signers/utils.js";
import type {
	Eip1559Transaction,
	Transaction,
} from "../../../src/typescript/native/primitives/transaction-types.js";

const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const signer = PrivateKeySignerImpl.fromPrivateKey({
	privateKey: testPrivateKey,
});

const testTransaction: Eip1559Transaction = {
	to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
	value: 1000000000000000000n,
	chainId: 1n,
	nonce: 0n,
	maxFeePerGas: 20000000000n,
	maxPriorityFeePerGas: 1000000000n,
	gasLimit: 21000n,
	data: "0x",
	accessList: [],
	v: 0n,
	r: "0x0",
	s: "0x0",
};

// Cache the signed transaction for benchmarking
let signedTransaction: Transaction | null = null;

export async function main(): Promise<void> {
	// Sign transaction on first run only
	if (!signedTransaction) {
		signedTransaction = await signer.signTransaction(testTransaction);
	}
	await recoverTransactionAddress(signedTransaction);
}
