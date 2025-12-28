import { Address, Hex, Transaction } from "voltaire";
// Transaction Serialization: RLP encode/decode transactions

// Create EIP-1559 transaction
const tx: Transaction.EIP1559 = {
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

// Serialize to RLP encoded bytes
const serialized = Transaction.serialize(tx);

// Deserialize back to transaction
const deserialized = Transaction.deserialize(serialized);

// Detect transaction type from serialized bytes
const detectedType = Transaction.detectType(serialized);
