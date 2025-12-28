import { Address, Transaction } from "voltaire";
// Transaction Modification: Create modified copies of transactions

// Original transaction
const original: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

// Update nonce (returns new transaction)
const withNewNonce = Transaction.withNonce(original, 5n);

// Update gas limit
const withNewGasLimit = Transaction.withGasLimit(original, 50_000n);

// Update gas price (for legacy transactions)
const legacy: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n,
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	v: 27n,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

const withNewGasPrice = Transaction.withGasPrice(legacy, 25_000_000_000n);

// Update data
const functionCall = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]); // Function selector
const withNewData = Transaction.withData(original, functionCall);
