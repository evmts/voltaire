import { Wallet } from "ethers";

const testPrivateKey =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const wallet = new Wallet(testPrivateKey);

const testTransaction = {
	to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
	value: 1000000000000000000n,
	chainId: 1,
	nonce: 0,
	maxFeePerGas: 20000000000n,
	maxPriorityFeePerGas: 1000000000n,
	gasLimit: 21000n,
	data: "0x",
	type: 2, // EIP-1559
};

export async function main(): Promise<void> {
	await wallet.signTransaction(testTransaction);
}
